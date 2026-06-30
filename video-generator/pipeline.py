# Pillow 10+ compatibility hotfix for MoviePy 1.x
import PIL.Image
if not hasattr(PIL.Image, "ANTIALIAS"):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS

import os
import subprocess
import atexit
import hashlib
# pyrefly: ignore [missing-import]
import imageio_ffmpeg
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
from datetime import datetime
from time import perf_counter
import threading
import tracemalloc
import tempfile
import uuid
import psutil
import gc
from PIL import Image, ImageOps
from moviepy.editor import CompositeVideoClip, ColorClip, VideoFileClip  # type: ignore

from config import FPS, WATERMARK_TEXT

VIDEO_WIDTH = 720
VIDEO_HEIGHT = 480


FFMPEG_PRESET = "veryfast"
FFMPEG_CRF = 26
FFMPEG_THREADS = 2
FFMPEG_FAST_PARAMS = [
    "-preset",
    FFMPEG_PRESET,
    "-crf",
    str(FFMPEG_CRF),
    "-threads",
    str(FFMPEG_THREADS),
]

# Ensure ffmpeg is discoverable in Render/native environments.
os.environ.setdefault("IMAGEIO_FFMPEG_EXE", imageio_ffmpeg.get_ffmpeg_exe())
from helpers import validate_image_sizes
from utils import (
    create_logo_overlay,
    apply_common_overlays,
    smooth_zoom,
    add_fade,
    apply_transition_pair,
)

try:
    from memory_profiler import memory_usage  # type: ignore
except Exception:
    memory_usage = None

try:
    from tqdm import tqdm
except Exception:
    tqdm = None


def create_watermark_clip(text, duration):
    # Temporary safe fallback to ensure end-to-end rendering.
    return (
        ColorClip(size=(1, 1), color=(0, 0, 0))
        .set_opacity(0)
        .set_position(("right", "bottom"))
        .set_duration(duration)
    )


class _ParallelismTracker:
    def __init__(self, label):
        self.label = label
        self._lock = threading.Lock()
        self._t0 = perf_counter()
        self._current = 0
        self.max_concurrent = 0
        # events: ("start"|"end", seg_index, perf_ts, wall_iso)
        self.events = []

    def _wall_ts(self):
        # ISO-ish wall timestamp for easy overlap verification in logs.
        return datetime.now().strftime("%H:%M:%S.%f")[:-3]

    def start(self, seg_index):
        t = perf_counter()
        wall = self._wall_ts()
        with self._lock:
            self._current += 1
            self.max_concurrent = max(self.max_concurrent, self._current)
            self.events.append(("start", seg_index, t, wall))
            current = self._current
        print(
            f"[{self.label}] start segment {seg_index + 1} | t={t - self._t0:.3f}s | concurrent={current} | {wall}",
            flush=True,
        )

    def end(self, seg_index):
        t = perf_counter()
        wall = self._wall_ts()
        with self._lock:
            self._current = max(0, self._current - 1)
            self.events.append(("end", seg_index, t, wall))
            current = self._current
        print(
            f"[{self.label}] done  segment {seg_index + 1} | t={t - self._t0:.3f}s | concurrent={current} | {wall}",
            flush=True,
        )

    def _overlap_detected(self):
        # Returns True if any segment start overlaps a previous segment end.
        starts = {}
        ends = {}
        for kind, idx, t, _ in self.events:
            if kind == "start":
                starts[idx] = t
            elif kind == "end":
                ends[idx] = t
        segments = sorted(starts.keys())
        for i in segments:
            for j in segments:
                if i >= j:
                    continue
                si = starts.get(i)
                ei = ends.get(i)
                sj = starts.get(j)
                ej = ends.get(j)
                if si is None or ei is None or sj is None or ej is None:
                    continue
                # Overlap if j starts before i ends and i starts before j ends.
                if sj < ei and si < ej:
                    return True
        return False

    def report(self):
        parallel = "YES" if (self.max_concurrent >= 2 and self._overlap_detected()) else "NO"
        return {
            "max_concurrent": self.max_concurrent,
            "parallel_execution": parallel,
        }


class _PerfProbe:
    def __init__(self):
        self.process = psutil.Process(os.getpid())
        self.mem_samples_mb = []
        self.cpu_samples_pct = []
        self.step_marks = []
        self.start_time = None
        self.last_cpu_time = None
        self.last_wall = None
        self.peak_rss_mb = 0.0
        self.tmp_dir = tempfile.gettempdir()

    def start(self):
        self.start_time = perf_counter()
        self.last_wall = self.start_time
        self.last_cpu_time = self._cpu_time_total()
        tracemalloc.start()
        self.sample("start")

    def _cpu_time_total(self):
        # Include child processes (ffmpeg) so reported CPU reflects actual pipeline utilization.
        total = 0.0
        try:
            total += sum(self.process.cpu_times()[:2])
        except Exception:
            pass
        try:
            for child in self.process.children(recursive=True):
                try:
                    total += sum(child.cpu_times()[:2])
                except Exception:
                    pass
        except Exception:
            pass
        return total

    def _sample_cpu_pct(self):
        now = perf_counter()
        cpu_time = self._cpu_time_total()
        wall_dt = max(1e-6, now - self.last_wall)
        cpu_dt = max(0.0, cpu_time - self.last_cpu_time)
        self.last_wall = now
        self.last_cpu_time = cpu_time
        cores = max(1, psutil.cpu_count(logical=True) or 1)
        return min(100.0, (cpu_dt / wall_dt) * 100.0 / cores)

    def _tmp_usage_bytes(self):
        total = 0
        try:
            for root, _, files in os.walk(self.tmp_dir):
                for f in files:
                    try:
                        total += os.path.getsize(os.path.join(root, f))
                    except Exception:
                        pass
        except Exception:
            pass
        return total

    def sample(self, label):
        rss_mb = self.process.memory_info().rss / (1024 * 1024)
        self.mem_samples_mb.append(rss_mb)
        if rss_mb > self.peak_rss_mb:
            self.peak_rss_mb = rss_mb
        cpu_pct = self._sample_cpu_pct()
        self.cpu_samples_pct.append(cpu_pct)
        tmp_mb = self._tmp_usage_bytes() / (1024 * 1024)
        self.step_marks.append((label, rss_mb, cpu_pct, tmp_mb))

    def finish(self):
        self.sample("end")
        elapsed = max(0.0, perf_counter() - self.start_time)
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        avg_mem = sum(self.mem_samples_mb) / max(1, len(self.mem_samples_mb))
        avg_cpu = sum(self.cpu_samples_pct) / max(1, len(self.cpu_samples_pct))
        return {
            "elapsed_sec": elapsed,
            "peak_rss_mb": self.peak_rss_mb,
            "avg_rss_mb": avg_mem,
            "avg_cpu_pct": avg_cpu,
            "tracemalloc_peak_mb": peak / (1024 * 1024),
            "steps": self.step_marks,
        }

    def print_report(self, report, memory_profiler_peak_mb=None):
        print("=== PERFORMANCE TRACE ===", flush=True)
        for label, rss_mb, cpu_pct, tmp_mb in report["steps"]:
            print(
                f"[perf] {label:>12} | RSS {rss_mb:8.1f} MB | CPU {cpu_pct:6.1f}% | TMP {tmp_mb:8.1f} MB",
                flush=True,
            )
        print("=== PERFORMANCE REPORT ===", flush=True)
        print(f"Peak RAM: {report['peak_rss_mb']:.1f} MB", flush=True)
        print(f"Avg RAM: {report['avg_rss_mb']:.1f} MB", flush=True)
        print(f"CPU Usage: {report['avg_cpu_pct']:.1f} %", flush=True)
        print(f"Execution Time: {report['elapsed_sec']:.2f} sec", flush=True)
        print(f"Tracemalloc Peak: {report['tracemalloc_peak_mb']:.1f} MB", flush=True)
        if memory_profiler_peak_mb is not None:
            print(f"memory_profiler Peak: {memory_profiler_peak_mb:.1f} MB", flush=True)


def _rss_mb():
    try:
        return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
    except Exception:
        return 0.0


def _render_segment(
    clip,
    out_path,
    fps,
    ffmpeg_params,
    preset,
    threads,
    audio=False,
    bitrate=None,
    close_clip=True,
):
    # Hard-lock encoding settings for consistent performance.
    preset = FFMPEG_PRESET
    threads = FFMPEG_THREADS
    ffmpeg_params = list(FFMPEG_FAST_PARAMS)

    print(f"[debug] resolution: {clip.w}x{clip.h}", flush=True)
    print(f"[debug] preset: {FFMPEG_PRESET}", flush=True)
    print(f"[debug] threads: {FFMPEG_THREADS}", flush=True)

    last_err = None
    for attempt in range(2):
        try:
            clip.write_videofile(
                out_path,
                fps=fps,
                codec="libx264",
                bitrate=bitrate,
                preset=preset,
                ffmpeg_params=ffmpeg_params,
                audio=audio,
                audio_codec="aac" if audio else None,
                logger=None,
                threads=threads,
            )
            last_err = None
            break
        except Exception as e:
            last_err = e
            if attempt == 0:
                try:
                    gc.collect()
                except Exception:
                    pass
                continue
    if last_err is not None:
        raise last_err
    if close_clip:
        try:
            clip.close()
        except Exception:
            pass


def _write_concat_list(segment_paths, concat_path):
    def _escape(p):
        p = os.path.abspath(p).replace("\\", "/")
        return p.replace("'", "'\\''")
    with open(concat_path, "w", encoding="utf-8") as f:
        for p in segment_paths:
            f.write(f"file '{_escape(p)}'\n")


def _cleanup_dir(path):
    if not path:
        return
    try:
        if os.path.isdir(path):
            for p in os.listdir(path):
                try:
                    os.remove(os.path.join(path, p))
                except Exception:
                    pass
            os.rmdir(path)
    except Exception:
        pass


def _mkdtemp(prefix):
    """
    Create a temp directory.

    Default behavior uses the OS temp dir. To force temp files into a specific location
    (useful in restricted or containerized environments), set MAATI_TMP_ROOT.
    """
    tmp_root = os.getenv("MAATI_TMP_ROOT")
    if tmp_root:
        try:
            os.makedirs(tmp_root, exist_ok=True)
            # Avoid tempfile.mkdtemp(dir=...) here: some restricted Windows sandbox setups
            # create directories that ffmpeg/PIL then can't write into. A plain mkdir works.
            d = os.path.join(tmp_root, f"{prefix}{uuid.uuid4().hex}")
            os.makedirs(d, exist_ok=False)
            return os.path.abspath(d)
        except Exception:
            pass
    return os.path.abspath(tempfile.mkdtemp(prefix=prefix))


def _ffprobe_exe():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    ffprobe = ffmpeg.replace("ffmpeg", "ffprobe")
    if os.path.exists(ffprobe):
        return ffprobe
    return None


def _ffprobe_stream(path):
    ffprobe = _ffprobe_exe()
    if not ffprobe:
        return None
    cmd = [
        ffprobe,
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name,width,height,pix_fmt,avg_frame_rate",
        "-of",
        "default=noprint_wrappers=1:nokey=0",
        path,
    ]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
    except Exception:
        return None
    info = {}
    for line in out.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            info[k.strip()] = v.strip()
    return info


def _fps_from_rate(rate):
    try:
        if "/" in rate:
            num, den = rate.split("/", 1)
            return float(num) / float(den) if float(den) != 0 else 0.0
        return float(rate)
    except Exception:
        return 0.0


def _normalize_segment(path, out_path, target, fps, crf, bitrate, preset):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    vf = f"scale={target['width']}:{target['height']}"
    # Hard-lock encoding settings for consistent performance.
    preset = FFMPEG_PRESET
    crf = FFMPEG_CRF
    bitrate = None
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        path,
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-pix_fmt",
        target["pix_fmt"],
        "-preset",
        preset,
        "-threads",
        str(FFMPEG_THREADS),
        "-r",
        str(fps),
    ]
    cmd += ["-crf", str(crf)]

    print(f"[debug] resolution: {target['width']}x{target['height']}", flush=True)
    print(f"[debug] preset: {FFMPEG_PRESET}", flush=True)
    print(f"[debug] threads: {FFMPEG_THREADS}", flush=True)
    cmd += [out_path]
    _run_ffmpeg(cmd)
    return out_path


def _ffmpeg_concat(concat_path, output_path, reencode=False, fps=24, crf=None, preset="veryfast", bitrate=None):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", concat_path]
    if reencode:
        # Hard-lock encoding settings for consistent performance.
        preset = FFMPEG_PRESET
        crf = FFMPEG_CRF
        bitrate = None
        cmd += [
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-preset",
            preset,
            "-threads",
            str(FFMPEG_THREADS),
            "-crf",
            str(crf),
        ]
        cmd += ["-r", str(fps)]

        # No reliable width/height here without probing; log locked settings anyway.
        print(f"[debug] preset: {FFMPEG_PRESET}", flush=True)
        print(f"[debug] threads: {FFMPEG_THREADS}", flush=True)
    else:
        cmd += ["-c", "copy"]
    cmd += [output_path]
    _run_ffmpeg(cmd)


def _ffmpeg_remux_to_ts(input_mp4, output_ts):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        input_mp4,
        "-c",
        "copy",
        "-bsf:v",
        "h264_mp4toannexb",
        "-f",
        "mpegts",
        output_ts,
    ]
    _run_ffmpeg(cmd)


def _ffmpeg_concat_copy_only(concat_list_path, output_path, segment_paths):
    """
    Concat segments with stream copy ONLY (no re-encode).

    Primary path: concat demuxer over the provided list.
    Fallback: remux each segment to MPEG-TS (stream copy), then concat TS and remux back to MP4.
    """
    try:
        _ffmpeg_concat(concat_list_path, output_path, reencode=False)
        return
    except Exception as e:
        print(f"[warn] concat copy failed; attempting TS remux fallback ({e})", flush=True)

    ts_paths = []
    ts_list_path = concat_list_path.replace(".txt", "_ts.txt")
    for p in segment_paths:
        ts_path = p.replace(".mp4", ".ts")
        _ffmpeg_remux_to_ts(p, ts_path)
        ts_paths.append(ts_path)
    _write_concat_list(ts_paths, ts_list_path)
    _ffmpeg_concat(ts_list_path, output_path, reencode=False)


def _ffmpeg_mux_audio(video_path, audio_path, output_path, duration=None, volume=0.4):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        video_path,
        "-stream_loop",
        "-1",
        "-i",
        audio_path,
        "-filter_complex",
        f"[1:a]volume={volume}[bgm]",
        "-map",
        "0:v:0",
        "-map",
        "[bgm]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-threads",
        "2",
    ]
    if duration and duration > 0:
        cmd += [
            "-t",
            f"{duration:.3f}",
        ]
    else:
        cmd += [
            "-shortest",
        ]
    cmd += [
        output_path,
    ]
    _run_ffmpeg(cmd)


def _hash_first_last_frame(video_path):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    hashes = {}
    for label, args in [
        ("first", ["-i", video_path, "-vframes", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"]),
        ("last", ["-sseof", "-0.1", "-i", video_path, "-vframes", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"]),
    ]:
        try:
            cmd = [ffmpeg, "-v", "error"] + args
            data = subprocess.check_output(cmd)
            hashes[label] = hashlib.md5(data).hexdigest()
        except Exception:
            hashes[label] = None
    return hashes


def _tqdm(iterable, **kwargs):
    if tqdm is None:
        return iterable
    return tqdm(iterable, **kwargs)


def _stage_mark(stage, when="start"):
    print(f"[stage] {stage} {when}", flush=True)


def _stage_bar_update(stage_bar, label):
    if stage_bar is None:
        return
    try:
        stage_bar.set_postfix_str(label)
    except Exception:
        pass
    stage_bar.update(1)


def _run_ffmpeg(cmd):
    last_err = None
    for attempt in range(2):
        try:
            subprocess.run(cmd, check=True)
            last_err = None
            break
        except Exception as e:
            last_err = e
            if attempt == 0:
                continue
    if last_err is not None:
        raise last_err


def _parallel_workers():
    workers = max(1, min(2, (psutil.cpu_count(logical=True) or 1) - 1))
    try:
        workers = int(os.getenv("PARALLEL_JOBS", str(workers)))
    except Exception:
        pass
    return max(1, min(2, workers))


def _encoding_settings():
    # Hard-locked fast settings (no env overrides).
    return FFMPEG_PRESET, FFMPEG_CRF, FFMPEG_THREADS


def _ffmpeg_threads():
    # Hard-locked threads (no env overrides).
    return FFMPEG_THREADS


def _render_dimensions():
    # Hard-locked resolution (no env overrides).
    return VIDEO_WIDTH, VIDEO_HEIGHT


def _preprocess_image_worker(args):
    src_path, dst_path, target_w, target_h, quality = args
    try:
        with Image.open(src_path) as im:
            im = im.convert("RGB")
            # Default: preserve the full image (no cropping) by letterboxing/pillarboxing.
            # Use IMAGE_SCALE_MODE=cover to keep the old center-crop behavior.
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
        return (src_path, dst_path, None)
    except Exception as e:
        return (src_path, None, str(e))


def _render_process_segment_worker(args):
    (
        img_path,
        seg_path,
        process_duration,
        width,
        height,
        fps,
        ffmpeg_params,
        preset,
        threads,
        logo_path,
        watermark_text,
        baked_logo,
        template_name,
        enable_zoom,
    ) = args
    try:
        if template_name == "A":
            from scenes import template_a as template
        elif template_name == "B":
            from scenes import template_b as template
        else:
            from scenes import template_c as template
        from utils import create_logo_overlay, apply_common_overlays, smooth_zoom

        logo_overlay = create_logo_overlay(logo_path, process_duration)
        watermark = create_watermark_clip(watermark_text, process_duration)

        clip = template.build_process(img_path, process_duration, width, height)
        if enable_zoom:
            clip = smooth_zoom(clip, 0.03)
        if not baked_logo:
            clip = apply_common_overlays(clip, logo_overlay, watermark)
        clip = clip.set_duration(process_duration)
        _render_segment(clip, seg_path, fps, ffmpeg_params, preset, threads)
        try:
            logo_overlay.close()
            watermark.close()
        except Exception:
            pass
        return (seg_path, None)
    except Exception as e:
        return (seg_path, str(e))


def _render_main_segment_worker(args):
    (
        idx,
        clip,
        next_clip,
        transitions,
        width,
        height,
        fps,
        ffmpeg_params,
        preset,
        threads,
        bitrate,
        final_segments_dir,
    ) = args
    try:
        in_dur = transitions[idx - 1]["duration"] if idx > 0 else 0.0
        out_dur = transitions[idx]["duration"] if idx < len(transitions) else 0.0
        kind = transitions[idx]["kind"] if idx < len(transitions) else None

        base_clip = clip
        if in_dur > 0:
            base_clip = base_clip.subclip(in_dur, base_clip.duration)

        if out_dur > 0 and kind and next_clip is not None:
            prev_adj, next_adj = apply_transition_pair(
                clip, next_clip, kind, out_dur, width, height
            )
            if in_dur > 0:
                prev_adj = prev_adj.subclip(in_dur, prev_adj.duration)
            transition_start = max(0.0, (prev_adj.duration or 0.0) - out_dur)
            segment_clip = CompositeVideoClip(
                [prev_adj.set_start(0), next_adj.set_start(transition_start)],
                size=(width, height),
            ).set_duration(prev_adj.duration or 0.0)
        else:
            segment_clip = base_clip.set_duration(base_clip.duration)

        seg_path = os.path.join(final_segments_dir, f"main_{idx:02d}.mp4")
        _render_segment(
            segment_clip,
            seg_path,
            fps,
            ffmpeg_params,
            preset,
            threads,
            bitrate=bitrate,
            # IMPORTANT: don't close here. These segment clips share underlying readers
            # with other segments (via transitions/subclips). Closing them can close a
            # shared reader and trigger "read of closed file" in other segments.
            close_clip=False,
        )
        return (idx, seg_path, None)
    except Exception as e:
        return (idx, None, str(e))


def render_video(
    logo_path,
    intro_logo,
    farmer_img,
    farm_img,
    process_images,
    certificate_img,
    end_img,
    bgm_path=None,
    template_name="A",
    output_root=None,
    progress_cb=None,
    is_cancelled=None,
    baked_logo=False,
):
    probe = _PerfProbe()
    probe.start()
    tmp_segments_dir = None
    final_segments_dir = None
    preprocess_dir = None
    output_path = None
    render_width, render_height = _render_dimensions()
    if template_name == "A":
        from scenes import template_a as template
    elif template_name == "B":
        from scenes import template_b as template
    else:
        from scenes import template_c as template

    if progress_cb:
        progress_cb(1, "preprocess")
    _stage_mark("preprocess", "start")
    probe.sample("preprocess")
    preprocess_dir = _mkdtemp(prefix="maati_pre_")
    atexit.register(_cleanup_dir, preprocess_dir)

    def _pp_path(name, idx=None):
        suffix = f"_{idx:03d}" if idx is not None else ""
        return os.path.join(preprocess_dir, f"{name}{suffix}.jpg")

    # Build preprocessing tasks.
    prep_tasks = [
        (intro_logo, _pp_path("intro"), render_width, render_height, 90, "intro image", False),
        (farmer_img, _pp_path("farmer"), max(1, render_width // 2), render_height, 90, "farmer image", False),
        (farm_img, _pp_path("farm"), max(1, render_width // 2), render_height, 90, "farm image", False),
        (certificate_img, _pp_path("cert"), render_width, render_height, 90, "certificate image", False),
        (end_img, _pp_path("end"), render_width, render_height, 90, "end image", False),
    ]
    for i, p in enumerate(process_images):
        prep_tasks.append((p, _pp_path("process", i), render_width, render_height, 88, "process image", True))

    max_workers = _parallel_workers()

    prep_results = {}
    invalid_process = []

    def _run_preprocess(executor_cls):
        with executor_cls(max_workers=max_workers) as ex:
            futures = {}
            for src_path, dst_path, tw, th, q, label, skippable in prep_tasks:
                futures[ex.submit(_preprocess_image_worker, (src_path, dst_path, tw, th, q))] = (
                    src_path,
                    dst_path,
                    label,
                    skippable,
                )
            for fut in _tqdm(as_completed(futures), total=len(futures), desc="Preprocessing images"):
                src_path, dst_path, label, skippable = futures[fut]
                try:
                    _, out_path, err = fut.result()
                except Exception as e:
                    out_path, err = None, str(e)
                if out_path:
                    prep_results[src_path] = out_path
                else:
                    msg = f"[warn] {label} preprocess failed: {src_path} ({err})"
                    print(msg, flush=True)
                    if skippable:
                        invalid_process.append(src_path)
                    else:
                        prep_results[src_path] = src_path

    try:
        _run_preprocess(ProcessPoolExecutor)
    except Exception as e:
        # Some restricted Windows environments disallow multiprocessing primitives (pipes).
        print(f"[warn] preprocess ProcessPool failed; falling back to ThreadPool ({e})", flush=True)
        _run_preprocess(ThreadPoolExecutor)

    if invalid_process:
        process_images = [p for p in process_images if p not in invalid_process]

    intro_logo = prep_results.get(intro_logo, intro_logo)
    farmer_img = prep_results.get(farmer_img, farmer_img)
    farm_img = prep_results.get(farm_img, farm_img)
    certificate_img = prep_results.get(certificate_img, certificate_img)
    end_img = prep_results.get(end_img, end_img)
    process_images = [prep_results.get(p, p) for p in process_images]
    del prep_results
    gc.collect()

    if progress_cb:
        progress_cb(2, "validate")
    _stage_mark("preprocess", "done")
    _stage_mark("validate", "start")
    probe.sample("validate")
    validate_image_sizes(
        [
            (end_img, "end image", render_width, render_height),
            (certificate_img, "certificate image", render_width, render_height),
            (intro_logo, "intro image", render_width, render_height),
            (farmer_img, "farmer image", max(1, render_width // 2), render_height),
            (farm_img, "farm image", max(1, render_width // 2), render_height),
        ]
        + [(p, "process image", render_width, render_height) for p in process_images]
    )
    _stage_mark("validate", "done")
    if is_cancelled and is_cancelled():
        raise RuntimeError("cancelled")

    # -------------------------
    # DURATIONS (<= 30s)
    # -------------------------
    INTRO_DURATION = 2.0
    FARMER_DURATION = 2.0
    FARM_DURATION = 2.0
    CERT_DURATION = 2.0
    END_DURATION = 2.0
    BASE_TARGET_TOTAL = 30.0
    MAX_TOTAL = 30.0
    # Crossfade is memory-expensive; default off for low-RAM environments.
    try:
        CROSSFADE = float(os.getenv("CROSSFADE", "0"))
    except Exception:
        CROSSFADE = 0.0
    try:
        TRANSITION_DUR = float(os.getenv("TRANSITION_DUR", "0.6"))
    except Exception:
        TRANSITION_DUR = 0.6

    stage_bar = tqdm(total=8, desc="Pipeline stages") if tqdm is not None else None

    base_total = INTRO_DURATION + FARMER_DURATION + FARM_DURATION + CERT_DURATION + END_DURATION
    n_process = len(process_images)
    try:
        PROCESS_EXTRA = float(os.getenv("PROCESS_EXTRA", "1.0"))
    except Exception:
        PROCESS_EXTRA = 1.0
    TARGET_TOTAL = min(MAX_TOTAL, BASE_TARGET_TOTAL + (n_process * max(0.0, PROCESS_EXTRA)))

    if n_process > 0:
        process_duration = (BASE_TARGET_TOTAL - base_total + (n_process - 1) * CROSSFADE) / n_process
        if process_duration < 0:
            process_duration = 0
        process_duration += PROCESS_EXTRA
        total = base_total + process_duration * n_process
        if total > 0 and total > TARGET_TOTAL:
            scale = TARGET_TOTAL / total
            INTRO_DURATION *= scale
            FARMER_DURATION *= scale
            FARM_DURATION *= scale
            CERT_DURATION *= scale
            END_DURATION *= scale
            process_duration *= scale
    else:
        process_duration = 0.0

    # -------------------------
    # OVERLAYS
    # -------------------------
    TOTAL_DURATION = (
        INTRO_DURATION +
        FARMER_DURATION +
        FARM_DURATION +
        process_duration * n_process +
        CERT_DURATION +
        END_DURATION
    )
    if progress_cb:
        progress_cb(6, "overlays")
    _stage_mark("overlays", "start")
    probe.sample("overlays")
    logo_overlay = create_logo_overlay(logo_path, TOTAL_DURATION)
    watermark = create_watermark_clip(WATERMARK_TEXT, TOTAL_DURATION)
    _stage_mark("overlays", "done")

    # -------------------------
    # INTRO
    # -------------------------
    if progress_cb:
        progress_cb(10, "intro")
    _stage_mark("intro", "start")
    probe.sample("intro")
    intro = template.build_intro(intro_logo, INTRO_DURATION, render_width, render_height)
    if not baked_logo:
        intro = apply_common_overlays(intro, logo_overlay, watermark)
    intro = intro.set_duration(INTRO_DURATION)
    intro = add_fade(intro)
    _stage_mark("intro", "done")
    _stage_bar_update(stage_bar, "intro")

    # -------------------------
    # FARMER
    # -------------------------
    if progress_cb:
        progress_cb(20, "farmer")
    _stage_mark("farmer", "start")
    probe.sample("farmer")
    farmer = template.build_process(farmer_img, FARMER_DURATION, render_width, render_height)
    farmer = apply_common_overlays(farmer, logo_overlay, watermark).set_duration(FARMER_DURATION)
    farmer = add_fade(farmer)
    _stage_mark("farmer", "done")
    _stage_bar_update(stage_bar, "farmer")

    # -------------------------
    # FARM
    # -------------------------
    if progress_cb:
        progress_cb(25, "farm")
    _stage_mark("farm", "start")
    probe.sample("farm")
    farm = template.build_process(farm_img, FARM_DURATION, render_width, render_height)
    farm = apply_common_overlays(farm, logo_overlay, watermark).set_duration(FARM_DURATION)
    farm = add_fade(farm)
    _stage_mark("farm", "done")
    _stage_bar_update(stage_bar, "farm")

    # -------------------------
    # PROCESS (streamed segments)
    # -------------------------
    process_layers = []
    process_t = 0.0
    tmp_segments_dir = _mkdtemp(prefix="maati_segments_")
    atexit.register(_cleanup_dir, tmp_segments_dir)
    segment_paths = []

    # Intermediate segments encoded with hard-locked fast params for concat copy.
    ffmpeg_preset, crf, ffmpeg_threads = _encoding_settings()
    segment_ffmpeg_params = list(FFMPEG_FAST_PARAMS)

    enable_zoom = os.getenv("ENABLE_ZOOM", "1") == "1"

    # Process segments: always cap to 2 workers for RAM safety, default to 2 for speed.
    try:
        process_workers = int(os.getenv("PROCESS_WORKERS", "2"))
    except Exception:
        process_workers = 2
    process_workers = max(1, min(2, process_workers))
    process_parallelism = {"max_concurrent": 0, "parallel_execution": "NO"}

    if n_process > 0:
        if progress_cb:
            progress_cb(30, "process")
        _stage_mark("process", "start")
        probe.sample("process_prepare")
        process_tracker = _ParallelismTracker("process")
        tasks = []
        for idx, img in enumerate(process_images):
            seg_path = os.path.join(tmp_segments_dir, f"process_{idx:03d}.mp4")
            tasks.append(
                (
                    img,
                    seg_path,
                    process_duration,
                    render_width,
                    render_height,
                    FPS,
                    segment_ffmpeg_params,
                    ffmpeg_preset,
                    ffmpeg_threads,
                    logo_path,
                    WATERMARK_TEXT,
                    baked_logo,
                    template_name,
                    enable_zoom,
                )
            )

        def _render_process_wrapped(seg_index, task):
            process_tracker.start(seg_index)
            try:
                seg_path, err = _render_process_segment_worker(task)
                return (seg_index, seg_path, err)
            finally:
                process_tracker.end(seg_index)

        with ThreadPoolExecutor(max_workers=min(process_workers, n_process)) as ex:
            futures = {ex.submit(_render_process_wrapped, i, t): i for i, t in enumerate(tasks)}
            for fut in _tqdm(as_completed(futures), total=len(futures), desc="Generating segments"):
                if is_cancelled and is_cancelled():
                    raise RuntimeError("cancelled")
                _, seg_path, err = fut.result()
                if err:
                    print(f"[warn] segment failed: {seg_path} ({err})", flush=True)
                    continue
                segment_paths.append(seg_path)
                print(
                    f"[stream] processed {len(segment_paths)}/{n_process} | RSS { _rss_mb():.1f} MB",
                    flush=True,
                )
        segment_paths.sort()
        process_parallelism = process_tracker.report()
        del tasks
        gc.collect()
        _stage_mark("process", "done")
        _stage_bar_update(stage_bar, "process")
    else:
        _stage_mark("process", "skipped")
        _stage_bar_update(stage_bar, "process")

    # Load lightweight video clips for transitions (no full image list in RAM)
    for idx, seg_path in enumerate(_tqdm(segment_paths, desc="Loading segments")):
        clip = VideoFileClip(seg_path, audio=False)
        clip = clip.set_duration(process_duration)
        if CROSSFADE > 0:
            if idx == 0:
                clip = clip.set_start(0)
                process_t += process_duration
            else:
                clip = clip.set_start(process_t - CROSSFADE).crossfadein(CROSSFADE)
                process_t += process_duration
        process_layers.append(clip)

    # -------------------------
    # CERTIFICATE
    # -------------------------
    if progress_cb:
        progress_cb(75, "certificate")
    _stage_mark("certificate", "start")
    probe.sample("certificate")
    certificate = template.build_end(certificate_img, CERT_DURATION, render_width, render_height)
    if not baked_logo:
        certificate = apply_common_overlays(certificate, logo_overlay, watermark)
    certificate = certificate.set_duration(CERT_DURATION)
    certificate = add_fade(certificate)
    _stage_mark("certificate", "done")
    _stage_bar_update(stage_bar, "certificate")

    # -------------------------
    # END
    # -------------------------
    if progress_cb:
        progress_cb(80, "end")
    _stage_mark("end", "start")
    probe.sample("end")
    end = template.build_end(end_img, END_DURATION, render_width, render_height)
    if not baked_logo:
        end = apply_common_overlays(end, logo_overlay, watermark)
    end = end.set_duration(END_DURATION)
    end = add_fade(end)
    _stage_mark("end", "done")
    _stage_bar_update(stage_bar, "end")

    # -------------------------
    # FINAL VIDEO
    # -------------------------
    def build_transition_sequence(clips, transitions, width, height):
        if not clips:
            return None
        layers = []
        t = 0.0
        prev_start = 0.0
        prev_clip = None
        for i, clip in enumerate(clips):
            if i == 0:
                layers.append(clip.set_start(0))
                prev_clip = layers[-1]
                prev_start = 0.0
                t = clip.duration or 0.0
                continue
            kind = transitions[i - 1].get("kind", "dissolve")
            dur = transitions[i - 1].get("duration", TRANSITION_DUR)
            prev_adj, curr_adj = apply_transition_pair(prev_clip, clip, kind, dur, width, height)
            layers[-1] = prev_adj.set_start(prev_start)
            start = max(0.0, t - dur)
            layers.append(curr_adj.set_start(start))
            prev_clip = layers[-1]
            prev_start = start
            t = start + (clip.duration or 0.0)
        return CompositeVideoClip(layers, size=(width, height)).set_duration(t)

    if CROSSFADE > 0:
        probe.sample("process_mix")
        process_total = process_t - max(0, (n_process - 1) * CROSSFADE)
        process_sequence = CompositeVideoClip(
            process_layers, size=(render_width, render_height)
        ).set_duration(process_total)
    else:
        if template_name == "A":
            process_transition_kinds = ["dissolve", "flow"]
        elif template_name == "B":
            process_transition_kinds = ["slide", "dissolve", "flow"]
        else:
            process_transition_kinds = ["flow", "slide", "dissolve"]
        process_transitions = []
        for i in range(max(0, n_process - 1)):
            kind = process_transition_kinds[i % len(process_transition_kinds)]
            process_transitions.append({"kind": kind, "duration": min(0.7, TRANSITION_DUR)})
        probe.sample("process_mix")
        process_sequence = build_transition_sequence(process_layers, process_transitions, render_width, render_height)

    if progress_cb:
        progress_cb(88, "concat")
    _stage_mark("concat", "start")
    probe.sample("concat")
    main_clips = [intro, farmer, farm, process_sequence, certificate, end]
    # Template-specific transitions for distinct feel.
    if template_name == "A":
        main_transitions = [
            {"kind": "dissolve", "duration": TRANSITION_DUR},      # intro -> farmer
            {"kind": "flow", "duration": TRANSITION_DUR * 0.9},     # farmer -> farm
            {"kind": "dissolve", "duration": TRANSITION_DUR},      # farm -> process
            {"kind": "flow", "duration": TRANSITION_DUR * 0.9},    # process -> certificate
            {"kind": "dissolve", "duration": TRANSITION_DUR},      # certificate -> end
        ]
    elif template_name == "B":
        main_transitions = [
            {"kind": "slide", "duration": TRANSITION_DUR * 0.9},   # intro -> farmer
            {"kind": "dissolve", "duration": TRANSITION_DUR * 0.9},# farmer -> farm
            {"kind": "flow", "duration": TRANSITION_DUR},          # farm -> process
            {"kind": "dissolve", "duration": TRANSITION_DUR * 0.9},# process -> certificate
            {"kind": "slide", "duration": TRANSITION_DUR * 0.9},   # certificate -> end
        ]
    else:
        main_transitions = [
            {"kind": "dissolve", "duration": TRANSITION_DUR},      # intro -> farmer
            {"kind": "slide", "duration": TRANSITION_DUR * 0.9},   # farmer -> farm
            {"kind": "flow", "duration": TRANSITION_DUR},          # farm -> process
            {"kind": "dissolve", "duration": TRANSITION_DUR * 0.9},# process -> certificate
            {"kind": "dissolve", "duration": TRANSITION_DUR},      # certificate -> end
        ]
    total_clip_duration = sum((c.duration or 0.0) for c in main_clips if c is not None)
    total_transition = sum(t.get("duration", 0.0) for t in main_transitions)
    cap_duration = min(TARGET_TOTAL, max(0.0, total_clip_duration - total_transition))

    # -------------------------
    # BGM (optional)
    # -------------------------
    if bgm_path is None:
        bgm_path = os.getenv("BGM_PATH")
    if not bgm_path:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        default_bgms = [
            os.path.join(os.path.dirname(__file__), "assets", "audio", "bgm.mpeg"),
            os.path.join(os.path.dirname(__file__), "assets", "audio", "bgm.mp3"),
            os.path.join(repo_root, "src", "assets", "bgm.mpeg"),
            os.path.join(repo_root, "src", "assets", "bgm.mp3"),
            os.path.join(repo_root, "assets", "bgm.mpeg"),
            os.path.join(repo_root, "assets", "bgm.mp3"),
        ]
        for candidate in default_bgms:
            if os.path.exists(candidate):
                bgm_path = candidate
                break
    try:
        bgm_volume = float(os.getenv("BGM_VOLUME", "0.4"))
    except Exception:
        bgm_volume = 0.4
    if output_root:
        output_dir = output_root
    else:
        downloads_dir = os.path.join(os.path.expanduser("~"), "Downloads")
        output_dir = os.path.join(downloads_dir, "maati_videos")
    os.makedirs(output_dir, exist_ok=True)
    template_dir = os.path.join(output_dir, template_name)
    os.makedirs(template_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"video_{template_name}_{timestamp}.mp4"
    output_path = os.path.join(template_dir, output_filename)
    counter = 1
    while os.path.exists(output_path):
        output_filename = f"video_{template_name}_{timestamp}_{counter}.mp4"
        output_path = os.path.join(template_dir, output_filename)
        counter += 1

    ffmpeg_preset, crf, ffmpeg_threads = _encoding_settings()
    # Avoid +faststart on per-segment encodes; final mux adds +faststart once.
    ffmpeg_params = list(FFMPEG_FAST_PARAMS)
    bitrate = None
    if progress_cb:
        progress_cb(92, "encode")
    _stage_mark("encode", "start")
    probe.sample("encode")
    # ffmpeg_preset/crf/ffmpeg_threads already set via _encoding_settings().

    # Render transition-baked main segments, then concat via ffmpeg.
    final_segments_dir = _mkdtemp(prefix="maati_main_segments_")
    atexit.register(_cleanup_dir, final_segments_dir)
    final_segments = []
    temp_concat_out = os.path.join(final_segments_dir, "concat_out.mp4")
    concat_list = os.path.join(final_segments_dir, "concat.txt")
    try:
        render_tasks = []
        for i, clip in enumerate(main_clips):
            render_tasks.append(
                (
                    i,
                    clip,
                    main_clips[i + 1] if i < len(main_clips) - 1 else None,
                    main_transitions,
                    render_width,
                    render_height,
                    FPS,
                    ffmpeg_params,
                    ffmpeg_preset,
                    ffmpeg_threads,
                    bitrate,
                    final_segments_dir,
                )
            )
        # Parallel rendering (2 workers max) with a safety constraint:
        # never render adjacent segments concurrently, since each segment may reference the next clip
        # for its outgoing transition (avoids shared readers being used concurrently).
        parallel_main = os.getenv("PARALLEL_MAIN", "1") != "0"
        if parallel_main and len(render_tasks) > 1:
            with ThreadPoolExecutor(max_workers=min(2, len(render_tasks))) as ex:
                for parity in (0, 1):
                    batch = [t for t in render_tasks if (t[0] % 2) == parity]
                    futures = {ex.submit(_render_main_segment_worker, task): task[0] for task in batch}
                    for fut in _tqdm(as_completed(futures), total=len(futures), desc=f"Rendering main segments (batch {parity})"):
                        if is_cancelled and is_cancelled():
                            raise RuntimeError("cancelled")
                        idx, seg_path, err = fut.result()
                        if err:
                            raise RuntimeError(f"main segment {idx + 1} failed: {err}")
                        final_segments.append((idx, seg_path))
                        print(
                            f"[stream] main segment {idx + 1}/{len(main_clips)} | RSS { _rss_mb():.1f} MB",
                            flush=True,
                        )
        else:
            for task in _tqdm(render_tasks, total=len(render_tasks), desc="Rendering main segments"):
                if is_cancelled and is_cancelled():
                    raise RuntimeError("cancelled")
                idx, seg_path, err = _render_main_segment_worker(task)
                if err:
                    raise RuntimeError(f"main segment {idx + 1} failed: {err}")
                final_segments.append((idx, seg_path))
                print(
                    f"[stream] main segment {idx + 1}/{len(main_clips)} | RSS { _rss_mb():.1f} MB",
                    flush=True,
                )
        final_segments = [seg_path for _, seg_path in sorted(final_segments)]
        del render_tasks
        gc.collect()

        # Concat via stream copy only (no segment normalization/re-encode).
        _write_concat_list(final_segments, concat_list)
        _ffmpeg_concat_copy_only(concat_list, temp_concat_out, final_segments)

        actual_dur = None
        try:
            v_clip = VideoFileClip(temp_concat_out)
            actual_dur = v_clip.duration
            v_clip.close()
            print(f"[audio] probed actual video duration: {actual_dur:.3f}s", flush=True)
        except Exception as e:
            print(f"[warn] could not probe video duration: {e}", flush=True)
            actual_dur = cap_duration

        if bgm_path and os.path.exists(bgm_path):
            print(f"[audio] resolved bgm_path: {bgm_path}", flush=True)
            print(f"[audio] muxing BGM (volume={bgm_volume}, duration={actual_dur:.2f}s)", flush=True)
            _ffmpeg_mux_audio(temp_concat_out, bgm_path, output_path, duration=actual_dur, volume=bgm_volume)
        else:
            print(f"[audio] no BGM path found or file does not exist, copying video only", flush=True)
            os.replace(temp_concat_out, output_path)
        _stage_mark("concat", "done")
        _stage_mark("encode", "done")
        _stage_bar_update(stage_bar, "concat")
        _stage_bar_update(stage_bar, "encode")
    except Exception as e:
        # Ensure no corrupted output left behind.
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
        except Exception:
            pass
        raise RuntimeError(f"Final concat failed: {e}")
    if progress_cb:
        progress_cb(100, "done")
    report = probe.finish()
    memory_profiler_peak_mb = None
    if memory_usage is not None:
        try:
            mem_samples = memory_usage(-1, interval=0.1, timeout=0.5)
            if mem_samples:
                memory_profiler_peak_mb = max(mem_samples)
        except Exception:
            pass
    # Identify peak memory step and max CPU step.
    max_mem_step = max(report["steps"], key=lambda s: s[1], default=None)
    max_cpu_step = max(report["steps"], key=lambda s: s[2], default=None)
    if max_mem_step:
        print(f"[perf] peak memory step: {max_mem_step[0]}", flush=True)
    if max_cpu_step:
        print(f"[perf] max CPU step: {max_cpu_step[0]}", flush=True)
    # Recommendations with safety margin.
    peak_mb = report["peak_rss_mb"]
    min_ram_gb = (peak_mb * 1.3) / 1024
    rec_ram_gb = (peak_mb * 1.5) / 1024
    cpu_cores = max(1, psutil.cpu_count(logical=True) or 1)
    report["recommended_ram_gb"] = rec_ram_gb
    report["min_ram_gb"] = min_ram_gb
    report["cpu_cores"] = cpu_cores
    probe.print_report(report, memory_profiler_peak_mb=memory_profiler_peak_mb)
    print("=== RECOMMENDED SYSTEM ===", flush=True)
    print(f"RAM: {rec_ram_gb:.2f} GB (min {min_ram_gb:.2f} GB)", flush=True)
    print(f"CPU: {cpu_cores} cores", flush=True)
    # Verification: duration + frame hashes
    expected_dur = cap_duration
    actual_dur = None
    info = _ffprobe_stream(output_path)
    if info and "avg_frame_rate" in info:
        # Duration via ffprobe (format) isn't captured here; fallback to VideoFileClip if needed.
        try:
            clip = VideoFileClip(output_path, audio=False)
            actual_dur = clip.duration
            clip.close()
        except Exception:
            actual_dur = None
    elif info is None:
        print("[warn] ffprobe not available; skipping stream validation details.", flush=True)
    if actual_dur is not None and abs(actual_dur - expected_dur) > 0.05:
        print(
            f"[warn] duration mismatch: expected {expected_dur:.2f}s, got {actual_dur:.2f}s",
            flush=True,
        )
    frame_hashes = _hash_first_last_frame(output_path)
    print(f"[verify] first_frame_md5: {frame_hashes.get('first')}", flush=True)
    print(f"[verify] last_frame_md5: {frame_hashes.get('last')}", flush=True)
    try:
        output_mb = os.path.getsize(output_path) / (1024 * 1024)
    except Exception:
        output_mb = 0.0
    print("=== FINAL REPORT ===", flush=True)
    print(f"Execution Time: {report['elapsed_sec']:.2f} sec", flush=True)
    print(f"Peak RAM: {report['peak_rss_mb']:.1f} MB", flush=True)
    print(f"CPU Usage: {report['avg_cpu_pct']:.1f} %", flush=True)
    print(f"Output Size: {output_mb:.1f} MB", flush=True)
    if actual_dur is not None:
        print(f"Duration: {actual_dur:.2f} sec", flush=True)
    else:
        print(f"Duration: {expected_dur:.2f} sec", flush=True)
    print(f"Output File: {output_path}", flush=True)

    print("=== PARALLELISM REPORT ===", flush=True)
    print(f"Max concurrent segments: {process_parallelism.get('max_concurrent', 0)}", flush=True)
    print(f"Parallel execution: {process_parallelism.get('parallel_execution', 'NO')}", flush=True)
    print(f"CPU utilization observed: {report['avg_cpu_pct']:.1f} %", flush=True)
    bottleneck_removed = "YES" if process_parallelism.get("parallel_execution") == "YES" else "NO"
    print(f"Sequential bottleneck removed: {bottleneck_removed}", flush=True)
    # Explicitly close clips to release memory.
    for clip in [intro, farmer, farm, certificate, end, logo_overlay, watermark, process_sequence]:
        try:
            clip.close()
        except Exception:
            pass
    for clip in process_layers:
        try:
            clip.close()
        except Exception:
            pass
    # Clean up segment files
    _cleanup_dir(tmp_segments_dir)
    _cleanup_dir(preprocess_dir)
    # Clean up main segment files
    _cleanup_dir(final_segments_dir)
    try:
        if stage_bar is not None:
            stage_bar.close()
    except Exception:
        pass
    return output_path
