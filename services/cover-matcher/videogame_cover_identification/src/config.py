"""Configuration settings for the videogame cover identification system."""

import logging
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SearchConfig:
    """Configuration for search operations."""

    topk: int = 25
    rerank_k: int = 5
    accept_threshold: float = 0.25
    geom_score_threshold: float = 0.3


@dataclass
class IndexConfig:
    """Configuration for index building."""

    jsonl_path: str = "metadata.jsonl"
    use_gpu: bool = True
    index_path: str = "covers.faiss"
    npy_path: str = "covers.npy"
    meta_path: str = "covers_meta.json"


@dataclass
class TrainingConfig:
    """Configuration for model training."""

    jsonl_path: str = "metadata.jsonl"
    epochs: int = 5
    batch_size: int = 32
    lr: float = 5e-4
    workers: int = 8
    dim: int = 512
    amp: str = "fp16"
    out_path: str = "cover_encoder.pt"
    temperature: float = 0.07
    grad_accumulation_steps: int = 4


@dataclass
class ModelConfig:
    """Configuration for model loading."""

    clip_model: str = "ViT-B-16"
    clip_pretrained: str = "laion2b_s34b_b88k"
    weights_path: str = "data/cover_encoder.pt"


@dataclass
class PathConfig:
    """Configuration for path detection."""

    covers_root_env: str = "COVERS_ROOT"
    default_covers_dir: str = "covers"
    data_dir: str = "data"


@dataclass
class LoggingConfig:
    """Configuration for logging."""

    level: str = "INFO"
    format: str = "%(asctime)s %(levelname)s %(name)s: %(message)s"


def setup_logging(config: LoggingConfig = None):
    """Setup centralized logging configuration."""
    if config is None:
        config = LoggingConfig()
    logging.basicConfig(level=getattr(logging, config.level), format=config.format)


@dataclass
class AppConfig:
    """Main application configuration."""

    device: Optional[str] = None  # Auto-detect if None
    paths: PathConfig = field(default_factory=PathConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    search: SearchConfig = field(default_factory=SearchConfig)
    index: IndexConfig = field(default_factory=IndexConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)

    def __post_init__(self):
        if self.device is None:
            try:
                import torch

                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                self.device = "cpu"


# Global configuration instance
config = AppConfig()

# Setup logging with centralized configuration
setup_logging(config.logging)
