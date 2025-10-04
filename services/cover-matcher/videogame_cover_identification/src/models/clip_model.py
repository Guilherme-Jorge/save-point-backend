"""CLIP model wrapper and utilities."""

import logging
import os

import open_clip
import torch
import torch.nn as nn
import torch.nn.functional as f

logger = logging.getLogger(__name__)


def _infer_clip_embed_dim(clip_model: nn.Module) -> int:
    """Infer CLIP image embedding dimension robustly.

    Args:
        clip_model: The full CLIP model.

    Returns:
        Image embedding dimension as an integer.
    """
    val = getattr(clip_model, "embed_dim", None)
    if val is not None:
        return int(val)
    with torch.no_grad():
        dummy = torch.zeros(1, 3, 224, 224)
        return int(clip_model.encode_image(dummy).shape[-1])


class ImgModel(nn.Module):
    """Wrapper for CLIP visual encoder plus projection.

    Args:
        clip_model: Full CLIP model from open_clip.
        projection: Linear layer or identity mapping to output dim.
    """

    def __init__(self, clip_model: nn.Module, projection: nn.Module):
        super().__init__()
        self.clip = clip_model
        self.proj = projection

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feats = self.clip.encode_image(x)
        feats = self.proj(feats) if not isinstance(self.proj, nn.Identity) else feats
        feats = f.normalize(feats, dim=-1)
        return feats


def load_encoder(device: str = "cuda", weights_path: str = "data/cover_encoder.pt"):
    """Load fine-tuned image encoder and preprocess.

    If `cover_encoder.pt` is present, loads weights saved by training.
    Otherwise, returns base CLIP with identity projection.

    Args:
        device: Target device string (e.g., "cuda" or "cpu").
        weights_path: Path to the fine-tuned weights file.

    Returns:
        Tuple of (encoder model in eval mode on device, PIL-to-tensor preprocess).
    """
    base, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-B-16", pretrained="laion2b_s34b_b88k"
    )

    in_dim = _infer_clip_embed_dim(base)
    state = None

    if os.path.exists(weights_path):
        state = torch.load(weights_path, map_location=device)
        proj_weight = state.get("proj.weight")
        proj = (
            nn.Linear(in_dim, int(proj_weight.shape[0]))
            if proj_weight is not None
            else nn.Identity()
        )
        model = ImgModel(base, proj)
        load_res = model.load_state_dict(state, strict=False)
        if hasattr(load_res, "missing_keys") and load_res.missing_keys:
            logger.warning("Missing keys when loading encoder: %s", load_res.missing_keys)
        if hasattr(load_res, "unexpected_keys") and load_res.unexpected_keys:
            logger.warning("Unexpected keys when loading encoder: %s", load_res.unexpected_keys)
        logger.info("Loaded fine-tuned encoder from %s", weights_path)
    else:
        logger.warning(
            "Fine-tuned weights not found at %s; using base CLIP with identity projection",
            weights_path,
        )
        model = ImgModel(base, nn.Identity())

    model.eval().to(device)
    return model, preprocess
