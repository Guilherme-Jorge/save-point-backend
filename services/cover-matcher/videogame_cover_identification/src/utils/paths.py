"""Path detection utilities."""

import logging
import os

logger = logging.getLogger(__name__)


def detect_covers_root(preferred: str | None = None) -> str:
    """Detect the directory that contains the `covers/` folder.

    This function searches for the covers directory in various candidate locations
    to ensure consistent path resolution across different components.

    Args:
        preferred: Optional first candidate to try.

    Returns:
        Absolute path to a directory containing a `covers` subfolder.
    """
    candidates = []
    if preferred:
        candidates.append(preferred)
    env_root = os.environ.get("COVERS_ROOT")
    if env_root:
        candidates.append(env_root)
    here = os.path.abspath(os.path.dirname(__file__))

    candidates.extend(
        [
            here,
            os.path.abspath(os.path.join(here, "..", "..")),
            os.path.abspath(os.path.join(here, "..", "..", "..")),
            os.path.abspath(os.path.join(here, "..", "..", "igdb-cover-extraction")),
            os.path.abspath(os.path.join(here, "..", "..", "..", "..")),
            os.path.abspath(os.path.join(here, "..", "..", "data")),
        ]
    )

    for c in candidates:
        try:
            if os.path.isdir(os.path.join(c, "covers")):
                logger.info("Using covers root: %s", c)
                return c
        except Exception:
            continue
    logger.warning("Could not auto-detect covers root; defaulting to script dir: %s", here)
    return here
