"""Cover search functionality."""

import logging
import os
import re
from typing import Any, Optional

import cv2
import torch

from ..config import config
from ..models.clip_model import load_encoder
from ..models.index import load_index
from ..utils.image import detect_and_rectify_cover, embed_image, sift_score
from ..utils.paths import detect_covers_root

logger = logging.getLogger(__name__)


def _extract_base_name(game_name: str) -> str:
    """Extract the base game name by removing edition suffixes.

    Args:
        game_name: The full game name including edition suffixes.

    Returns:
        The base game name without edition suffixes.
    """
    # Common edition suffixes to remove
    edition_patterns = [
        r"\s+-\s+Nintendo Switch 2 Edition$",
        r"\s+-\s+Special Edition$",
        r"\s+-\s+Limited Edition$",
        r"\s+-\s+Collectors? Edition$",
        r"\s+-\s+Starter Edition$",
        r"\s+-\s+Deluxe Edition$",
        r"\s+-\s+Ultimate Edition$",
        r"\s+-\s+Complete Edition$",
        r"\s+-\s+Game of the Year Edition$",
        r"\s+-\s+Enhanced Edition$",
        r"\s+-\s+Definitive Edition$",
        r"\s+-\s+Anniversary Edition$",
        r"\s+-\s+Remastered$",
        r"\s+-\s+HD$",
        r"\s+Edition$",
        r"\s+Special$",
        r"\s+Limited$",
        r"\s+Deluxe$",
    ]

    base_name = game_name
    for pattern in edition_patterns:
        base_name = re.sub(pattern, "", base_name, flags=re.IGNORECASE)

    return base_name.strip()


def _find_base_game(candidates: list[dict], all_metas: list[dict]) -> Optional[dict]:
    """Find the base game among candidates by grouping by base name and selecting shortest name.
    If no clear base is found in candidates, search all metadata for the base version.

    Args:
        candidates: List of game metadata dictionaries from search results.
        all_metas: Complete list of all game metadata.

    Returns:
        The base game metadata, or None if no clear base is found.
    """
    if not candidates:
        return None

    logger.debug(f"Finding base game among {len(candidates)} candidates")

    # Group games by their base name
    groups: dict[str, list[dict]] = {}
    for candidate in candidates:
        base_name = _extract_base_name(candidate["name"])
        logger.debug(f"Game: {candidate['name']} -> base: '{base_name}'")
        if base_name not in groups:
            groups[base_name] = []
        groups[base_name].append(candidate)

    logger.debug(f"Grouped into {len(groups)} base name groups: {list(groups.keys())}")

    # Find the largest group (most related games)
    if not groups:
        return None

    largest_group_key = max(groups.keys(), key=lambda k: len(groups[k]))
    group_members = groups[largest_group_key]

    logger.debug(f"Largest group '{largest_group_key}' has {len(group_members)} members:")
    for member in group_members:
        logger.debug(f"  - {member['id']}: {member['name']}")

    if len(group_members) <= 1:
        # Only one game in the group - check if it's already a base game (no edition suffix)
        candidate = group_members[0]
        candidate_base_name = _extract_base_name(candidate["name"])
        if candidate["name"] == candidate_base_name:
            # This is already a base game
            logger.debug(
                f"Only one game in group and it's already base: {candidate['id']} - {candidate['name']}"
            )
            return candidate
        else:
            # This is an edition, need to search all metadata for the base
            logger.debug(
                f"Only one game in group but it's an edition, will search all metadata: {candidate['id']} - {candidate['name']}"
            )
            return None

    # Among group members, find the one with shortest name (likely the base)
    # If tie, prefer the one with lowest ID (assuming chronological order)
    base_game = min(group_members, key=lambda g: (len(g["name"]), g["id"]))

    logger.debug(f"Selected base game from group: {base_game['id']} - {base_game['name']}")
    return base_game


def _extract_base_names_from_candidates(candidates: list[dict]) -> set[str]:
    """Extract unique base names from candidate games."""
    base_names = set()
    for candidate in candidates:
        base_name = _extract_base_name(candidate["name"])
        if base_name:
            base_names.add(base_name.strip())
    return base_names


def _find_matching_games_in_metadata(base_names: set[str], all_metas: list[dict]) -> list[dict]:
    """Find all games in metadata that match the given base names."""
    matching_games = []
    for meta in all_metas:
        game_base_name = _extract_base_name(meta["name"])
        if game_base_name in base_names:
            matching_games.append(
                {
                    "id": meta["id"],
                    "name": meta["name"],
                    "cover_id": meta.get("cover_id"),
                    "cover_url": meta.get("cover_url"),
                    "local_filename": meta.get("local_filename"),
                    "base_name": game_base_name,
                }
            )
    return matching_games


def _group_games_by_base_name(matching_games: list[dict]) -> dict[str, list[dict]]:
    """Group games by their base name."""
    groups: dict[str, list[dict]] = {}
    for game in matching_games:
        base_name = game["base_name"]
        if base_name not in groups:
            groups[base_name] = []
        groups[base_name].append(game)
    return groups


def _find_base_games_for_groups(groups: dict[str, list[dict]]) -> list[dict]:
    """Find the base game (shortest name) for each group."""
    base_games = []
    for base_name, group_members in groups.items():
        if len(group_members) > 0:
            base_game = min(group_members, key=lambda g: (len(g["name"]), g["id"]))
            base_games.append(base_game)
            logger.debug(
                f"Selected base game for '{base_name}': {base_game['id']} - {base_game['name']}"
            )
    return base_games


def _select_best_base_game(
    base_games: list[dict], base_names: set[str], candidates: list[dict]
) -> Optional[dict]:
    """Select the most appropriate base game from available options."""
    if not base_games:
        return None

    # Prioritize the base name from the best matching candidate (first in reranked results)
    if candidates:
        best_candidate_base = _extract_base_name(candidates[0]["name"])
        for bg in base_games:
            if bg["base_name"] == best_candidate_base:
                logger.debug(
                    f"Returning base game for best match '{best_candidate_base}': {bg['id']} - {bg['name']}"
                )
                return bg

    # Find the base game that corresponds to the base names from our candidates
    for base_name in base_names:
        for bg in base_games:
            if bg["base_name"] == base_name:
                logger.debug(f"Returning base game for '{base_name}': {bg['id']} - {bg['name']}")
                return bg

    # Fallback: return the base game with shortest name
    fallback = min(base_games, key=lambda g: (len(g["name"]), g["id"]))
    logger.debug(f"Fallback base game: {fallback['id']} - {fallback['name']}")
    return fallback


def _find_base_game_from_all_metas(candidates: list[dict], all_metas: list[dict]) -> Optional[dict]:
    """Find the base game by searching all metadata for games with similar base names.

    Args:
        candidates: List of game metadata dictionaries from search results.
        all_metas: Complete list of all game metadata.

    Returns:
        The base game metadata, or None if no clear base is found.
    """
    if not candidates:
        return None

    base_names = _extract_base_names_from_candidates(candidates)

    if not base_names:
        return None

    logger.debug(f"Base names extracted from candidates: {base_names}")

    matching_games = _find_matching_games_in_metadata(base_names, all_metas)

    logger.debug(f"Found {len(matching_games)} matching games in metadata")
    for game in matching_games[:5]:  # Log first 5 for debugging
        logger.debug(f"Matching game: {game['id']} - {game['name']}")

    if not matching_games:
        return None

    groups = _group_games_by_base_name(matching_games)
    base_games = _find_base_games_for_groups(groups)

    return _select_best_base_game(base_games, base_names, candidates)


def _embed_query_image(model, preprocess, query_bgr: cv2.Mat):
    """Embed the query image using the model."""
    return embed_image(model, preprocess, query_bgr)


def _search_index(index, metas: list, query_embedding, topk: int) -> list[tuple[float, int, dict]]:
    """Search the FAISS index and return candidates."""
    d, indices = index.search(query_embedding, topk)
    return [(float(d[0][j]), int(indices[0][j]), metas[int(indices[0][j])]) for j in range(topk)]


def _rerank_with_geometric_scoring(candidates: list, query_bgr: cv2.Mat, rerank_k: int) -> list:
    """Rerank candidates using geometric scoring with SIFT."""
    reranked = []
    covers_root = detect_covers_root()

    for sim, idx, meta in candidates[:rerank_k]:
        rel = meta.get("local_filename")
        cand_path = os.path.join(covers_root, rel) if isinstance(rel, str) else None
        cand_bgr = None
        if isinstance(cand_path, str) and os.path.exists(cand_path):
            cand_bgr = cv2.imread(cand_path, cv2.IMREAD_COLOR)
        if cand_bgr is None:
            reranked.append((sim, 0.0, idx, meta))
            continue
        score, inliers = sift_score(query_bgr, cand_bgr)
        reranked.append((sim, score, idx, meta))

    reranked.sort(key=lambda t: (t[1], t[0]), reverse=True)
    return reranked


def _collect_all_candidates(reranked: list) -> list[dict]:
    """Collect all candidates for base game identification."""
    all_candidates = []
    for s, _, _, m in reranked[:10]:  # Get more candidates for base game detection
        all_candidates.append(
            {
                "cosine": float(s),
                "id": m["id"],
                "name": m["name"],
                "cover_id": m["cover_id"],
                "cover_url": m["cover_url"],
                "local_filename": m["local_filename"],
            }
        )
    return all_candidates


def _find_base_game_from_candidates(all_candidates: list[dict], metas: list) -> Optional[dict]:
    """Find base game among candidates, or search all metadata if not found."""
    base_game = _find_base_game(all_candidates, metas)
    if not base_game:
        base_game = _find_base_game_from_all_metas(all_candidates, metas)
    return base_game


def _format_search_results(
    sim: float, geo: float, meta: dict, reranked: list, base_game: Optional[dict]
) -> dict[str, Any]:
    """Format the search results into the expected dictionary structure."""
    return {
        "cosine": float(sim),
        "geom_score": float(geo),
        "match": {
            "id": meta["id"],
            "name": meta["name"],
            "cover_id": meta["cover_id"],
            "cover_url": meta["cover_url"],
            "local_filename": meta["local_filename"],
        },
        "alternatives": [
            {"cosine": float(s), "id": m["id"], "name": m["name"]} for (s, _, _, m) in reranked[1:5]
        ],
        "base": {
            "cosine": base_game.get("cosine"),
            "id": base_game["id"] if base_game else None,
            "name": base_game["name"] if base_game else None,
        }
        if base_game
        else None,
    }


def _search_once(
    index, metas: list, model, preprocess, query_bgr: cv2.Mat, topk: int, rerank_k: int
) -> dict[str, Any]:
    """Run a single retrieval pass and geometric re-ranking.

    Args:
        index: FAISS index.
        metas: Metadata list aligned with index entries.
        model: Image encoder model.
        preprocess: Preprocessing function for images.
        query_bgr: BGR image array used as query.
        topk: Number of candidates to retrieve from FAISS.
        rerank_k: Number of top candidates to rerank geometrically.

    Returns:
        Dictionary with cosine, geom_score, match metadata and alternatives.
    """
    q = _embed_query_image(model, preprocess, query_bgr)
    cands = _search_index(index, metas, q, topk)
    reranked = _rerank_with_geometric_scoring(cands, query_bgr, rerank_k)

    best = reranked[0] if reranked else cands[0]
    sim = best[0]
    geo = best[1] if len(best) > 3 else 0.0
    meta = best[3] if len(best) > 3 else best[2]

    all_candidates = _collect_all_candidates(reranked)
    base_game = _find_base_game_from_candidates(all_candidates, metas)

    return _format_search_results(sim, geo, meta, reranked, base_game)


def search_cover(
    image_path: str,
    topk: Optional[int] = None,
    rerank_k: Optional[int] = None,
    accept: Optional[float] = None,
    device: Optional[str] = None,
) -> dict[str, Any]:
    """Search for the best-matching game cover given an input image path.

    Args:
        image_path: Path to the user-provided photo.
        topk: Number of candidates to retrieve from FAISS.
        rerank_k: Number of top candidates to rerank geometrically.
        accept: Cosine similarity acceptance threshold.
        device: Device to use for computation.

    Returns:
        Result dictionary with scores, best match and alternatives.
    """
    # Use config defaults if not specified
    topk = topk or config.search.topk
    rerank_k = rerank_k or config.search.rerank_k
    accept = accept or config.search.accept_threshold
    device = device or config.device

    covers_root = detect_covers_root()
    index_path = config.index.index_path
    if not os.path.isabs(index_path):
        index_path = os.path.join(covers_root, index_path)
    meta_path = config.index.meta_path
    if not os.path.isabs(meta_path):
        meta_path = os.path.join(covers_root, meta_path)

    index, metas = load_index(index_path, meta_path)
    model, preprocess = load_encoder(device, config.model.weights_path)

    with torch.no_grad():
        dummy = torch.zeros(1, 3, 224, 224, device=next(model.parameters()).device)
        out_dim = int(model(dummy).shape[-1])

    if getattr(index, "d", None) not in (None, out_dim):
        raise ValueError(
            f"Index dim {getattr(index, 'd', None)} does not match model dim {out_dim}"
        )

    bgr = cv2.imread(image_path, cv2.IMREAD_COLOR)
    crop, overlay, quad = detect_and_rectify_cover(bgr)

    try:
        cv2.imwrite("export_crop.png", crop)
        cv2.imwrite("export_debug.png", overlay)
        logger.info(
            "Exported rectified crop to export_crop.png and debug overlay to export_debug.png"
        )
    except Exception as e:
        logger.warning("Failed to export debug images: %s", e)

    res_crop = _search_once(index, metas, model, preprocess, crop, topk, rerank_k)
    res_full = _search_once(index, metas, model, preprocess, bgr, topk, rerank_k)

    def _score_key(r):
        return (r.get("geom_score", 0.0), r.get("cosine", 0.0))

    pick_crop = _score_key(res_crop) >= _score_key(res_full)
    chosen = res_crop if pick_crop else res_full
    chosen_variant = "crop" if pick_crop else "full"
    other = res_full if pick_crop else res_crop
    is_confident = (chosen["cosine"] >= accept) or (
        chosen["geom_score"] >= config.search.geom_score_threshold
    )

    result = {
        "confident": bool(is_confident),
        "strategy": chosen_variant,
        "cosine": float(chosen["cosine"]),
        "geom_score": float(chosen["geom_score"]),
        "match": chosen["match"],
        "alternatives": chosen["alternatives"],
        "base": chosen.get("base"),
        "other_variant": {
            "strategy": "full" if pick_crop else "crop",
            "cosine": float(other["cosine"]),
            "geom_score": float(other["geom_score"]),
        },
        "exports": {
            "crop": "export_crop.png",
            "debug": "export_debug.png",
            "quad": quad.tolist() if quad is not None else None,
        },
    }
    return result
