"""FastAPI wrapper for videogame cover identification search."""

import asyncio
import os
import tempfile
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

# Ensure the package is importable when running from /app
try:
    from videogame_cover_identification.src.search.search import search_cover  # type: ignore
    from videogame_cover_identification.src.config import config  # type: ignore
except Exception as exc:  # pragma: no cover
    raise RuntimeError(f"Failed to import components: {exc}")


app = FastAPI(title="Cover Matcher Service", version="1.0.0")


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


@app.post("/search-cover")
async def search_cover_endpoint(
    file: Annotated[UploadFile, File(description="Image file to search cover for")]
):
    # Respect COVERS_ROOT and WEIGHTS_PATH via startup config; persist upload temporarily.
    suffix = os.path.splitext(file.filename or "uploaded.jpg")[1] or ".jpg"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Call the underlying Python function which returns a dict
        result = await asyncio.to_thread(search_cover, tmp_path)
        return JSONResponse(result)
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
