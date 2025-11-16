"""FastAPI wrapper for videogame cover identification search."""

import asyncio
import os
import tempfile
from typing import Annotated, Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

try:
    from videogame_cover_identification.src.search.search import (
        SearchResources,
        load_search_resources,
        search_cover,
    )
    from videogame_cover_identification.src.config import config
    from videogame_cover_identification.src.utils.paths import detect_covers_root
except Exception as exc:
    raise RuntimeError(f"Failed to import components: {exc}")


app = FastAPI(title="Cover Matcher Service", version="1.0.0")
_search_resources: SearchResources | None = None


def _resolve_data_path(path: str, root: str) -> str:
    """Return an absolute path for index assets."""
    return path if os.path.isabs(path) else os.path.join(root, path)


def _search_with_cache(image_path: str) -> dict[str, Any]:
    """Execute cover search using preloaded resources."""
    if _search_resources is None:
        raise RuntimeError("Cover matcher is still warming up")
    return search_cover(image_path=image_path, resources=_search_resources)


@app.on_event("startup")
async def startup_event():
    # Allow overriding critical paths/devices via env without touching the package
    device = os.environ.get("DEVICE")
    if device:
        config.device = device

    weights_path = os.environ.get("WEIGHTS_PATH")
    if weights_path:
        config.model.weights_path = weights_path

    index_path = os.environ.get("INDEX_PATH")
    if index_path:
        config.index.index_path = index_path

    meta_path = os.environ.get("META_PATH")
    if meta_path:
        config.index.meta_path = meta_path

    covers_root = detect_covers_root()
    resolved_index = _resolve_data_path(config.index.index_path, covers_root)
    resolved_meta = _resolve_data_path(config.index.meta_path, covers_root)

    loop = asyncio.get_running_loop()
    global _search_resources
    _search_resources = await loop.run_in_executor(
        None,
        load_search_resources,
        config.device,
        config.model.weights_path,
        resolved_index,
        resolved_meta,
    )


@app.post("/search-cover")
async def search_cover_endpoint(
    file: Annotated[UploadFile, File(description="Image file to search cover for")]
):
    # Respect COVERS_ROOT and WEIGHTS_PATH via startup config; persist upload temporarily.
    suffix = os.path.splitext(file.filename or "uploaded.jpg")[1] or ".jpg"
    tmp_path = None
    if _search_resources is None:
        raise HTTPException(status_code=503, detail="Cover matcher warming up")
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Call the underlying Python function which returns a dict
        result = await asyncio.to_thread(_search_with_cache, tmp_path)
        return JSONResponse(result)
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
