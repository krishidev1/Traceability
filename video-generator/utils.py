import os
from moviepy.editor import *
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

_DEBUG_WATERMARK = os.getenv("DEBUG_WATERMARK") == "1"

def _load_font(fontsize, font_path=None):
    if font_path:
        try:
            return ImageFont.truetype(font_path, fontsize)
        except Exception:
            pass
    try:
        return ImageFont.truetype("arial.ttf", fontsize)
    except Exception:
        return ImageFont.load_default()

def text_clip_pil(text, fontsize=24, color="white", font_path=None, padding=10):
    if _DEBUG_WATERMARK:
        print("text_clip_pil: start", flush=True)
    font = _load_font(fontsize, font_path)
    if _DEBUG_WATERMARK:
        print("text_clip_pil: font loaded", flush=True)
    if _DEBUG_WATERMARK:
        print("text_clip_pil: estimating size", flush=True)
    # Avoid textbbox/getbbox/getsize on some Windows setups where it can hang.
    # Use a rough, safe estimate based on font size and text length.
    text_w = max(1, int(len(text) * fontsize * 0.6))
    text_h = max(1, int(fontsize * 1.2))
    if _DEBUG_WATERMARK:
        print("text_clip_pil: size estimated", flush=True)
    img = Image.new("RGBA", (text_w + padding * 2, text_h + padding * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.text((padding, padding), text, font=font, fill=color)
    if _DEBUG_WATERMARK:
        print("text_clip_pil: creating ImageClip", flush=True)
    clip = ImageClip(np.array(img))
    if _DEBUG_WATERMARK:
        print("text_clip_pil: ImageClip created", flush=True)
    return clip

def create_watermark(text, duration, width, height):
    if _DEBUG_WATERMARK:
        print("create_watermark: start", flush=True)
    # Use a transparent placeholder to avoid PIL text rendering hangs on some Windows setups.
    return (
        ColorClip(size=(1, 1), color=(0, 0, 0))
        .set_opacity(0)
        .set_position(("right", "bottom"))
        .set_duration(duration)
    )

def create_logo_overlay(logo_path, duration):
    return (
        ImageClip(logo_path)
        .resize(height=60)
        .set_position(("left", "top"))
        .set_duration(duration)
    )

def apply_common_overlays(base_clip, logo, watermark):
    return CompositeVideoClip([base_clip, logo, watermark])

def smooth_zoom(clip, zoom_factor=0.05):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def add_fade(clip, duration=0.2):
    # Completely disabled to ensure 100% clean, original image display without mask/opacity glitches
    return clip

def _ease_smoothstep(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)

def apply_cinematic_motion(clip, duration, width, height, zoom=0.06, dx=30, dy=18):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def apply_motion_variant(clip, duration, width, height, variant="zoom_in"):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def cinematic_grade(clip, contrast=1.12, saturation=1.10, warmth=0.05, lift=0.02, neon=0.03):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def _make_vignette(width, height, strength=0.35):
    return ColorClip(size=(width, height), color=(0, 0, 0)).set_opacity(0)

def _make_light_leak(width, height, color=(255, 190, 120), strength=0.22):
    return ColorClip(size=(width, height), color=(0, 0, 0)).set_opacity(0)

def _make_particles(width, height, count=160, alpha=45):
    return ColorClip(size=(width, height), color=(0, 0, 0)).set_opacity(0)

def _make_neon_frame(width, height, color=(120, 255, 220), alpha=55, pad=22):
    return ColorClip(size=(width, height), color=(0, 0, 0)).set_opacity(0)

def apply_cinematic_look(clip, duration, width, height, accent_color=(255, 200, 120)):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def _soft_glow(clip, strength=0.15, blur=3):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def apply_premium_look(clip, duration, width, height):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def _ease_in_out(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)

def apply_transition_blur(clip, blur_duration=0.25, max_blur=2.0):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def apply_soft_slide(clip, duration, width, height, direction="up", offset=24):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return clip

def _ramp(t, duration):
    return 1.0

def apply_transition_pair(prev_clip, next_clip, kind, duration, width, height):
    # Completely disabled to ensure clean cuts, avoiding any stride, alignment, or memory bugs
    return prev_clip, next_clip

def create_film_grain(width, height, duration, fps=30, strength=0.06):
    # Completely disabled to prevent any stride or rendering skew, maximizing image quality
    return ColorClip(size=(width, height), color=(0, 0, 0)).set_opacity(0).set_duration(duration)

