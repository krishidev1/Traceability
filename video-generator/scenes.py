import os
from moviepy.editor import CompositeVideoClip, ImageClip, ColorClip
from types import SimpleNamespace

from helpers import fit_to_half, safe_image_clip
from utils import apply_cinematic_motion, apply_premium_look

TEMPLATE_BG_PATH = os.path.join(
    os.path.dirname(__file__), "assets", "images", "Sample Bg.jpg"
)

def get_template_bg_clip(width, height, duration):
    if os.path.exists(TEMPLATE_BG_PATH):
        try:
            return ImageClip(TEMPLATE_BG_PATH).resize(newsize=(width, height)).set_duration(duration)
        except Exception as e:
            print(f"Failed to load background template: {e}", flush=True)
    return None

def build_intro_base(intro_logo, duration, width, height):
    bg_template = get_template_bg_clip(width, height, duration)
    
    photo_w, photo_h = int(width * 0.82), int(height * 0.82)
    bg = safe_image_clip(intro_logo, photo_w, photo_h, label="intro background")
    bg = apply_cinematic_motion(bg, duration, photo_w, photo_h, zoom=0.04, dx=0, dy=0)
    bg = bg.set_position(("center", "center"))
    
    layers = [bg]
    if bg_template:
        layers.insert(0, bg_template)
        
    intro = CompositeVideoClip(layers, size=(width, height)).set_duration(duration)
    return apply_premium_look(intro, duration, width, height)


def build_split_base(farmer_img, farm_img, duration, width, height):
    bg_template = get_template_bg_clip(width, height, duration)
    
    content_w, content_h = int(width * 0.82), int(height * 0.82)
    left_w = content_w // 2
    
    left = fit_to_half(farmer_img, "left", content_w, content_h).set_duration(duration)
    right = fit_to_half(farm_img, "right", content_w, content_h).set_duration(duration)
    
    left = apply_cinematic_motion(left, duration, left_w, content_h, zoom=0.03, dx=-8, dy=2)
    right = apply_cinematic_motion(right, duration, left_w, content_h, zoom=0.03, dx=8, dy=-2)
    
    split_content = CompositeVideoClip([left, right], size=(content_w, content_h)).set_duration(duration)
    split_content = split_content.set_position(("center", "center"))
    
    layers = [split_content]
    if bg_template:
        layers.insert(0, bg_template)
        
    base = CompositeVideoClip(layers, size=(width, height)).set_duration(duration)
    return apply_premium_look(base, duration, width, height)


def build_process_base(img_path, duration, width, height):
    bg_template = get_template_bg_clip(width, height, duration)
    
    photo_w, photo_h = int(width * 0.82), int(height * 0.82)
    clip = safe_image_clip(img_path, photo_w, photo_h, label="process image").set_duration(duration)
    clip = apply_cinematic_motion(clip, duration, photo_w, photo_h, zoom=0.04, dx=12, dy=-6)
    clip = clip.set_position(("center", "center"))
    
    layers = [clip]
    if bg_template:
        layers.insert(0, bg_template)
        
    base = CompositeVideoClip(layers, size=(width, height)).set_duration(duration)
    return apply_premium_look(base, duration, width, height)


def build_end_base(end_img, duration, width, height):
    bg_template = get_template_bg_clip(width, height, duration)
    
    photo_w, photo_h = int(width * 0.82), int(height * 0.82)
    clip = safe_image_clip(end_img, photo_w, photo_h, label="end image").set_duration(duration)
    clip = apply_cinematic_motion(clip, duration, photo_w, photo_h, zoom=0.04, dx=-10, dy=-6)
    clip = clip.set_position(("center", "center"))
    
    layers = [clip]
    if bg_template:
        layers.insert(0, bg_template)
        
    base = CompositeVideoClip(layers, size=(width, height)).set_duration(duration)
    return apply_premium_look(base, duration, width, height)


# Template A: clean, minimal
def build_intro_a(intro_logo, duration, width, height):
    return build_intro_base(intro_logo, duration, width, height)


def build_split_a(farmer_img, farm_img, duration, width, height):
    return build_split_base(farmer_img, farm_img, duration, width, height)


def build_process_a(img_path, duration, width, height):
    return build_process_base(img_path, duration, width, height)


def build_end_a(end_img, duration, width, height):
    return build_end_base(end_img, duration, width, height)


# Template B: slightly stronger contrast + soft top/bottom bars
def build_intro_b(intro_logo, duration, width, height):
    bg_template = get_template_bg_clip(width, height, duration)
    
    photo_w, photo_h = int(width * 0.82), int(height * 0.82)
    bg = safe_image_clip(intro_logo, photo_w, photo_h, label="intro background")
    bg = apply_cinematic_motion(bg, duration, photo_w, photo_h, zoom=0.04, dx=0, dy=0)
    bg = bg.set_position(("center", "center"))
    
    bar_h = max(1, int(height * 0.08))
    top = ColorClip(size=(width, bar_h), color=(0, 0, 0)).set_opacity(0.12).set_position(("center", 0))
    bottom = (
        ColorClip(size=(width, bar_h), color=(0, 0, 0))
        .set_opacity(0.12)
        .set_position(("center", height - bar_h))
    )
    
    layers = [bg, top, bottom]
    if bg_template:
        layers.insert(0, bg_template)
        
    base = CompositeVideoClip(layers, size=(width, height)).set_duration(duration)
    return apply_premium_look(base, duration, width, height)


def build_split_b(farmer_img, farm_img, duration, width, height):
    base = build_split_base(farmer_img, farm_img, duration, width, height)
    # Add a subtle center divider.
    divider = ColorClip(size=(4, height), color=(255, 255, 255)).set_opacity(0.15).set_position(("center", "center"))
    return CompositeVideoClip([base, divider], size=(width, height)).set_duration(duration)


def build_process_b(img_path, duration, width, height):
    return build_process_base(img_path, duration, width, height)


def build_end_b(end_img, duration, width, height):
    return build_end_base(end_img, duration, width, height)


# Template C: vignette-style frame
def build_intro_c(intro_logo, duration, width, height):
    bg_template = get_template_bg_clip(width, height, duration)
    
    photo_w, photo_h = int(width * 0.82), int(height * 0.82)
    bg = safe_image_clip(intro_logo, photo_w, photo_h, label="intro background")
    bg = apply_cinematic_motion(bg, duration, photo_w, photo_h, zoom=0.04, dx=0, dy=0)
    bg = bg.set_position(("center", "center"))
    
    pad = max(1, int(height * 0.05))
    frame = (
        ColorClip(size=(width - pad * 2, height - pad * 2), color=(0, 0, 0))
        .set_opacity(0.08)
        .set_position(("center", "center"))
    )
    
    layers = [bg, frame]
    if bg_template:
        layers.insert(0, bg_template)
        
    base = CompositeVideoClip(layers, size=(width, height)).set_duration(duration)
    return apply_premium_look(base, duration, width, height)


def build_split_c(farmer_img, farm_img, duration, width, height):
    base = build_split_base(farmer_img, farm_img, duration, width, height)
    pad = max(1, int(height * 0.05))
    frame = (
        ColorClip(size=(width - pad * 2, height - pad * 2), color=(0, 0, 0))
        .set_opacity(0.08)
        .set_position(("center", "center"))
    )
    return CompositeVideoClip([base, frame], size=(width, height)).set_duration(duration)


def build_process_c(img_path, duration, width, height):
    base = build_process_base(img_path, duration, width, height)
    pad = max(1, int(height * 0.05))
    frame = (
        ColorClip(size=(width - pad * 2, height - pad * 2), color=(0, 0, 0))
        .set_opacity(0.08)
        .set_position(("center", "center"))
    )
    return CompositeVideoClip([base, frame], size=(width, height)).set_duration(duration)


def build_end_c(end_img, duration, width, height):
    base = build_end_base(end_img, duration, width, height)
    pad = max(1, int(height * 0.05))
    frame = (
        ColorClip(size=(width - pad * 2, height - pad * 2), color=(0, 0, 0))
        .set_opacity(0.08)
        .set_position(("center", "center"))
    )
    return CompositeVideoClip([base, frame], size=(width, height)).set_duration(duration)


template_a = SimpleNamespace(
    build_intro=build_intro_a,
    build_split=build_split_a,
    build_process=build_process_a,
    build_end=build_end_a,
)

template_b = SimpleNamespace(
    build_intro=build_intro_b,
    build_split=build_split_b,
    build_process=build_process_b,
    build_end=build_end_b,
)

template_c = SimpleNamespace(
    build_intro=build_intro_c,
    build_split=build_split_c,
    build_process=build_process_c,
    build_end=build_end_c,
)
