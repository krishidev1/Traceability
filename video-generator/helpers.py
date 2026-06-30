from PIL import Image, ImageFilter, ImageOps
from moviepy.editor import ColorClip, ImageClip
import os


def resize_and_crop(clip, target_w, target_h, resample=Image.LANCZOS, enhance_if_upscale=True):
    # Scale proportionally to cover the target, then crop center.
    scale = max(target_w / clip.w, target_h / clip.h)
    new_w = int(round(clip.w * scale))
    new_h = int(round(clip.h * scale))
    try:
        clip = clip.resize(newsize=(new_w, new_h), resample=resample)
    except TypeError:
        # Fallback for older MoviePy versions that don't accept resample.
        clip = clip.resize(newsize=(new_w, new_h))

    # Light sharpen only when we had to upscale.
    if enhance_if_upscale and scale > 1.0:
        def _sharpen(frame):
            img = Image.fromarray(frame)
            img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=120, threshold=3))
            return np.array(img)
        try:
            import numpy as np
            clip = clip.fl_image(_sharpen)
        except Exception:
            pass
    return clip.crop(
        x_center=new_w / 2,
        y_center=new_h / 2,
        width=target_w,
        height=target_h,
    )

def resize_and_pad(clip, target_w, target_h, resample=Image.LANCZOS, bg_color=(0, 0, 0)):
    # Scale proportionally to fit inside the target, then pad (no cropping).
    scale = min(target_w / clip.w, target_h / clip.h)
    new_w = int(round(clip.w * scale))
    new_h = int(round(clip.h * scale))
    try:
        clip = clip.resize(newsize=(new_w, new_h), resample=resample)
    except TypeError:
        clip = clip.resize(newsize=(new_w, new_h))
    # MoviePy's on_color keeps the full image and pads the remaining area.
    return clip.on_color(size=(target_w, target_h), color=bg_color, pos=("center", "center"))


def safe_image_clip(path, target_w, target_h, label="image"):
    try:
        clip = ImageClip(path)
    except Exception as e:
        print(f"[warn] {label} unreadable, using placeholder: {path} ({e})", flush=True)
        return ColorClip(size=(target_w, target_h), color=(0, 0, 0))
    
    # If the pre-resized image already matches the target size exactly,
    # return it directly to avoid redundant resizing, cropping, or wrapping.
    if clip.w == target_w and clip.h == target_h:
        return clip
        
    mode = (os.getenv("IMAGE_SCALE_MODE") or "contain").strip().lower()
    if mode in {"cover", "crop", "fill"}:
        return resize_and_crop(clip, target_w, target_h)
    return resize_and_pad(clip, target_w, target_h)



def preprocess_cover(src_path, dst_path, target_w, target_h, quality=90):
    """
    Pre-resize to exactly target size to reduce RAM usage during MoviePy rendering.
    Default: preserve full image (no crop) via padding. Set IMAGE_SCALE_MODE=cover to center-crop.
    Returns dst_path (or src_path if preprocessing fails).
    """
    try:
        with Image.open(src_path) as im:
            im = im.convert("RGB")
            mode = (os.getenv("IMAGE_SCALE_MODE") or "contain").strip().lower()
            if mode in {"cover", "crop", "fill"}:
                im = ImageOps.fit(im, (target_w, target_h), method=Image.LANCZOS, centering=(0.5, 0.5))
            else:
                im = ImageOps.pad(
                    im,
                    (target_w, target_h),
                    method=Image.LANCZOS,
                    color=(0, 0, 0),
                    centering=(0.5, 0.5),
                )
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            im.save(dst_path, "JPEG", quality=quality, optimize=True)
        return dst_path
    except Exception as e:
        print(f"[warn] preprocess_cover failed for {src_path}: {e}", flush=True)
        return src_path


def preprocess_fit(src_path, dst_path, max_w, max_h, quality=90):
    """
    Pre-resize to fit within max_w/max_h preserving aspect ratio.
    Returns dst_path (or src_path if preprocessing fails).
    """
    try:
        with Image.open(src_path) as im:
            im = im.convert("RGB")
            im.thumbnail((max_w, max_h), Image.LANCZOS)
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            im.save(dst_path, "JPEG", quality=quality, optimize=True)
        return dst_path
    except Exception as e:
        print(f"[warn] preprocess_fit failed for {src_path}: {e}", flush=True)
        return src_path


def prepare_logo(src_path, dst_path, height=60):
    """
    Prepare a small RGBA logo for overlays and baking.
    Returns dst_path (or src_path if it fails).
    """
    try:
        with Image.open(src_path) as im:
            im = im.convert("RGBA")
            scale = height / max(1, im.height)
            new_w = max(1, int(round(im.width * scale)))
            im = im.resize((new_w, height), Image.LANCZOS)
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            im.save(dst_path, "PNG", optimize=True)
        return dst_path
    except Exception as e:
        print(f"[warn] prepare_logo failed for {src_path}: {e}", flush=True)
        return src_path


def bake_logo_on_image(base_path, logo_path, dst_path, margin=10, quality=90):
    """
    Bake a small logo onto a base image to reduce overlay compositing at render time.
    Returns dst_path (or base_path if it fails).
    """
    try:
        with Image.open(base_path) as base:
            base = base.convert("RGB")
            with Image.open(logo_path) as logo:
                logo = logo.convert("RGBA")
                base.paste(logo, (margin, margin), logo)
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            base.save(dst_path, "JPEG", quality=quality, optimize=True)
        return dst_path
    except Exception as e:
        print(f"[warn] bake_logo_on_image failed for {base_path}: {e}", flush=True)
        return base_path


def fit_to_half(path, side, target_w, target_h):
    clip = safe_image_clip(path, target_w // 2, target_h, label=f"{side} image")
    return clip.set_position((side, "center"))


def _image_size(path):
    try:
        with Image.open(path) as im:
            return im.size  # (w, h)
    except Exception:
        return None


def validate_image_sizes(items):
    """
    items: list of (path, label, min_w, min_h)
    Prints warnings but never exits.
    """
    warnings = []
    for path, label, min_w, min_h in items:
        size = _image_size(path)
        if not size:
            warnings.append(f"{label} unreadable: {path}")
            continue
        w, h = size
        if w < min_w or h < min_h:
            warnings.append(
                f"{label} small: {path} -> {w}x{h}, recommended >= {min_w}x{min_h}"
            )
    if warnings:
        print("Image size warnings:", flush=True)
        for w in warnings:
            print("  -", w, flush=True)
    return warnings
