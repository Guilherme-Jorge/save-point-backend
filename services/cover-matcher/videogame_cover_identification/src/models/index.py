"""FAISS index utilities."""

import json
import logging

import faiss
import numpy as np

logger = logging.getLogger(__name__)


def load_index(index_path: str = "data/covers.faiss", meta_path: str = "data/covers_meta.json"):
    """Load FAISS index and associated metadata.

    Args:
        index_path: Path to the FAISS index file.
        meta_path: Path to the metadata JSON file.

    Returns:
        Tuple (faiss.Index, list_of_meta_dicts)
    """
    index = faiss.read_index(index_path)
    with open(meta_path, encoding="utf-8") as f:
        metas = json.load(f)
    return index, metas


def build_faiss(embs: np.ndarray, use_gpu: bool = True) -> faiss.Index:
    """Build an inner-product FAISS index for normalized embeddings.

    Args:
        embs: Array of shape [N, D], expected L2-normalized per row.
        use_gpu: Whether to accelerate indexing on GPU if available.

    Returns:
        A CPU FAISS index suitable for search and serialization.
    """
    d = int(embs.shape[1])
    if use_gpu and faiss.get_num_gpus() > 0:
        res = faiss.StandardGpuResources()
        index_cpu = faiss.IndexFlatIP(d)
        index_gpu = faiss.index_cpu_to_gpu(res, 0, index_cpu)
        index_gpu.add(embs)
        index = faiss.index_gpu_to_cpu(index_gpu)
    else:
        index = faiss.IndexFlatIP(d)
        index.add(embs)
    return index


def save_index(
    index: faiss.Index,
    embs: np.ndarray,
    metas: list,
    index_path: str = "covers.faiss",
    npy_path: str = "covers.npy",
    meta_path: str = "covers_meta.json",
):
    """Save FAISS index, embeddings, and metadata to disk.

    Args:
        index: FAISS index to save.
        embs: Embeddings array.
        metas: Metadata list.
        index_path: Path for FAISS index file.
        npy_path: Path for embeddings numpy file.
        meta_path: Path for metadata JSON file.
    """
    faiss.write_index(index, index_path)
    np.save(npy_path, embs)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metas, f)
    logger.info("Saved %s, %s, %s", index_path, npy_path, meta_path)
