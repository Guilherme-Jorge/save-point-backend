"""Image processing utilities."""

import logging

import cv2
import numpy as np
import torch
from PIL import Image

logger = logging.getLogger(__name__)


def embed_image(model, preprocess, image_bgr: np.ndarray) -> np.ndarray:
    """Embed a BGR image into the encoder feature space.

    Args:
        model: Image encoder model.
        preprocess: Preprocessing function for images.
        image_bgr: BGR image array.

    Returns:
        Normalized embedding vector as numpy array.
    """
    im = Image.fromarray(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))
    x = preprocess(im).unsqueeze(0).to(next(model.parameters()).device)
    with torch.no_grad():
        z = model(x)
    return z.cpu().numpy().astype("float32")


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Order points in clockwise order: top-left, top-right, bottom-right, bottom-left.

    Args:
        pts: Array of 4 points.

    Returns:
        Ordered points array.
    """
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).flatten()
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(diff)]
    bl = pts[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def _should_skip_refinement(rectified: np.ndarray, height: int, width: int) -> bool:
    """Check if refinement should be skipped based on image properties."""
    return rectified.size == 0 or min(height, width) < 48


def _compute_gradients_and_thresholds(
    rectified: np.ndarray, height: int, width: int
) -> tuple[np.ndarray, np.ndarray, float, float] | None:
    """Compute gradients and thresholds for boundary detection."""
    gray = cv2.cvtColor(rectified, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    grad_x = cv2.Sobel(blurred, cv2.CV_32F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(blurred, cv2.CV_32F, 0, 1, ksize=3)
    col_strength = np.abs(grad_x).sum(axis=0)
    row_strength = np.abs(grad_y).sum(axis=1)

    if float(col_strength.max(initial=0.0)) <= 1e-6 or float(row_strength.max(initial=0.0)) <= 1e-6:
        return None

    kernel_w = max(3, width // 40)
    kernel_w = min(kernel_w, width)
    kernel_h = max(3, height // 40)
    kernel_h = min(kernel_h, height)
    kernel_cols = np.ones(kernel_w, dtype=np.float32) / float(kernel_w)
    kernel_rows = np.ones(kernel_h, dtype=np.float32) / float(kernel_h)
    col_strength = np.convolve(col_strength, kernel_cols, mode="same")
    row_strength = np.convolve(row_strength, kernel_rows, mode="same")

    col_threshold = float(col_strength.max()) * 0.3
    row_threshold = float(row_strength.max()) * 0.3
    if col_threshold <= 1e-6 or row_threshold <= 1e-6:
        return None

    return col_strength, row_strength, col_threshold, row_threshold


def _find_boundaries(
    col_strength: np.ndarray,
    row_strength: np.ndarray,
    col_threshold: float,
    row_threshold: float,
    width: int,
    height: int,
    margin_x: int,
    margin_y: int,
    pad_x: int,
    pad_y: int,
) -> tuple[int, int, int, int] | None:
    """Find the boundaries of the content region."""
    left_idx = None
    for idx in range(margin_x, width):
        if col_strength[idx] >= col_threshold:
            left_idx = idx
            break
    right_idx = None
    for idx in range(width - margin_x - 1, -1, -1):
        if col_strength[idx] >= col_threshold:
            right_idx = idx
            break
    top_idx = None
    for idx in range(margin_y, height):
        if row_strength[idx] >= row_threshold:
            top_idx = idx
            break
    bottom_idx = None
    for idx in range(height - margin_y - 1, -1, -1):
        if row_strength[idx] >= row_threshold:
            bottom_idx = idx
            break

    if None in (left_idx, right_idx, top_idx, bottom_idx):
        return None

    x0 = max(0, left_idx - pad_x)
    x1 = min(width, right_idx + pad_x + 1)
    y0 = max(0, top_idx - pad_y)
    y1 = min(height, bottom_idx + pad_y + 1)

    return x0, y0, x1, y1


def _adjust_bounds(
    x0: int, y0: int, x1: int, y1: int, width: int, height: int
) -> tuple[int, int, int, int]:
    """Adjust bounds with maximum margins and additional padding."""
    max_left = max(0, int(width * 0.06))
    max_right_margin = max(0, int(width * 0.03))
    max_top = max(0, int(height * 0.02))
    max_bottom_margin = max(0, int(height * 0.03))

    x0 = min(x0, max_left)
    y0 = min(y0, max_top)
    x1 = max(x1, width - max_right_margin)
    y1 = max(y1, height - max_bottom_margin)

    pad_h = max(1, int(width * 0.01))
    pad_v = max(1, int(height * 0.01))
    left_extra = min(x0, pad_h)
    top_extra = min(y0, pad_v)
    right_extra = min(width - x1, pad_h)
    bottom_extra = min(height - y1, pad_v)
    x0 -= left_extra
    y0 -= top_extra
    x1 += right_extra
    y1 += bottom_extra

    return x0, y0, x1, y1


def _is_valid_crop(x0: int, y0: int, x1: int, y1: int, width: int, height: int) -> bool:
    """Check if the crop meets minimum size requirements."""
    return x1 - x0 >= int(width * 0.6) and y1 - y0 >= int(height * 0.6)


def _refine_rectified_crop(
    rectified: np.ndarray,
) -> tuple[np.ndarray, tuple[int, int, int, int] | None]:
    """Refine the rectified crop by trimming marginal regions.

    Args:
        rectified: Perspective-rectified cover crop in BGR format.

    Returns:
        Tuple containing the refined crop and the bounds in the original rectified
        coordinates (x0, y0, x1, y1). Bounds is ``None`` when refinement is not
        applied.
    """
    height, width = rectified.shape[:2]

    if _should_skip_refinement(rectified, height, width):
        return rectified, None

    gradient_data = _compute_gradients_and_thresholds(rectified, height, width)
    if gradient_data is None:
        return rectified, None

    col_strength, row_strength, col_threshold, row_threshold = gradient_data

    margin_x = max(1, width // 20)
    margin_y = max(1, height // 20)
    pad_x = max(2, width // 100)
    pad_y = max(2, height // 100)

    bounds = _find_boundaries(
        col_strength,
        row_strength,
        col_threshold,
        row_threshold,
        width,
        height,
        margin_x,
        margin_y,
        pad_x,
        pad_y,
    )
    if bounds is None:
        return rectified, None

    x0, y0, x1, y1 = bounds
    x0, y0, x1, y1 = _adjust_bounds(x0, y0, x1, y1, width, height)

    if not _is_valid_crop(x0, y0, x1, y1, width, height):
        return rectified, None

    refined = rectified[y0:y1, x0:x1]
    return refined, (x0, y0, x1, y1)


def detect_and_rectify_cover(bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray | None]:
    """Detect and rectify a likely game cover in a handheld photo.

    The method searches for the largest convex quadrilateral with a portrait-like
    aspect ratio, then applies a perspective transform to obtain a rectified
    crop suitable for matching. If detection fails, the full image is returned.

    Args:
        bgr: Input image in BGR color space.

    Returns:
        Tuple ``(crop_bgr, debug_overlay_bgr, quad_points)`` where:
        - ``crop_bgr`` is the perspective-rectified cover crop (or the original
          image on failure),
        - ``debug_overlay_bgr`` is the original image with the detected
          quadrilateral drawn for visualization,
        - ``quad_points`` are the four corner points in image coordinates
          (ordered TL, TR, BR, BL) or ``None`` when not found.
    """
    overlay = bgr.copy()
    h_img, w_img = bgr.shape[:2]

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 7, 50, 50)
    thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 3)
    edges = cv2.Canny(thr, 50, 150)
    edges = cv2.dilate(edges, None, iterations=1)

    cnts, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    def right_angle_score(rect_pts: np.ndarray) -> float:
        v0 = rect_pts[1] - rect_pts[0]
        v1 = rect_pts[2] - rect_pts[1]
        v2 = rect_pts[3] - rect_pts[2]
        v3 = rect_pts[0] - rect_pts[3]

        def angle_cos(u, v):
            denom = (np.linalg.norm(u) * np.linalg.norm(v)) + 1e-6
            return np.dot(u, v) / denom

        cos_vals = [
            abs(angle_cos(v0, v1)),
            abs(angle_cos(v1, v2)),
            abs(angle_cos(v2, v3)),
            abs(angle_cos(v3, v0)),
        ]
        return 1.0 - float(min(1.0, sum(cos_vals) / 4.0))

    expect_ar = 1.48
    best = None
    best_score = -1.0

    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:30]
    for c in cnts:
        if cv2.contourArea(c) < 0.01 * w_img * h_img:
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            # fallback to minAreaRect to form a quad
            rect_box = cv2.boxPoints(cv2.minAreaRect(c))
            pts = rect_box.astype(np.float32)
        else:
            pts = approx.reshape(-1, 2).astype(np.float32)
        rect = _order_points(pts)
        width_top = np.linalg.norm(rect[0] - rect[1])
        width_bottom = np.linalg.norm(rect[3] - rect[2])
        height_left = np.linalg.norm(rect[0] - rect[3])
        height_right = np.linalg.norm(rect[1] - rect[2])
        width = max((width_top + width_bottom) * 0.5, 1.0)
        height = max((height_left + height_right) * 0.5, 1.0)
        ar = height / width
        if not (1.2 <= ar <= 2.2):
            continue
        area = width * height
        margin_to_border = min(
            rect[:, 0].min(), rect[:, 1].min(), w_img - rect[:, 0].max(), h_img - rect[:, 1].max()
        )
        margin_norm = max(0.0, float(margin_to_border) / max(w_img, h_img))
        angle_score = right_angle_score(rect)
        ar_score = float(np.exp(-abs(ar - expect_ar)))
        area_score = float(area / (w_img * h_img))
        total = 0.45 * ar_score + 0.35 * angle_score + 0.15 * area_score + 0.05 * margin_norm
        if total > best_score:
            best_score = total
            best = rect

    if best is None:
        cv2.putText(
            overlay,
            "No cover detected - using full image",
            (12, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 0, 255),
            2,
            cv2.LINE_AA,
        )
        return bgr, overlay, None

    w = int(max(np.linalg.norm(best[0] - best[1]), np.linalg.norm(best[2] - best[3])))
    h = int(max(np.linalg.norm(best[0] - best[3]), np.linalg.norm(best[1] - best[2])))
    w = max(w, 64)
    h = max(h, 64)
    dst = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype=np.float32)
    m = cv2.getPerspectiveTransform(best, dst)
    warped_full = cv2.warpPerspective(bgr, m, (w, h))
    refined, bounds = _refine_rectified_crop(warped_full)
    final_quad = best
    warped = warped_full
    if bounds is not None:
        x0, y0, x1, y1 = bounds
        crop_dst = np.array(
            [[x0, y0], [x1 - 1, y0], [x1 - 1, y1 - 1], [x0, y1 - 1]],
            dtype=np.float32,
        )
        m_inv = cv2.getPerspectiveTransform(dst, best)
        final_quad = cv2.perspectiveTransform(crop_dst.reshape(-1, 1, 2), m_inv).reshape(-1, 2)
        warped = refined
    cv2.polylines(overlay, [final_quad.astype(np.int32)], True, (0, 255, 0), 3, cv2.LINE_AA)
    return warped, overlay, final_quad


def sift_score(query_bgr: np.ndarray, cand_bgr: np.ndarray) -> tuple[float, int]:
    """Compute SIFT-based geometric matching score between two images.

    Args:
        query_bgr: Query image in BGR format.
        cand_bgr: Candidate image in BGR format.

    Returns:
        Tuple of (score, num_inliers) where score is the ratio of inliers to good matches.
    """
    sift = cv2.SIFT_create()
    qk, qd = sift.detectAndCompute(query_bgr, None)
    ck, cd = sift.detectAndCompute(cand_bgr, None)
    if qd is None or cd is None:
        return 0.0, 0
    index_params = dict(algorithm=1, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(qd, cd, k=2)
    good = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:
            good.append(m)
    if len(good) < 8:
        return 0.0, len(good)
    src = np.float32([qk[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([ck[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    h, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
    inliers = int(mask.sum()) if mask is not None else 0
    score = inliers / max(len(good), 1)
    return score, inliers
