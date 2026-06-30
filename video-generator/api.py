# Pillow 10+ compatibility hotfix for MoviePy 1.x
import PIL.Image
if not hasattr(PIL.Image, "ANTIALIAS"):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS

# Silence asyncio proactor connection reset spam on Windows
import sys
if sys.platform == "win32":
    import asyncio
    try:
        from asyncio.proactor_events import _ProactorBasePipeTransport
        _orig_call_connection_lost = _ProactorBasePipeTransport._call_connection_lost
        def _patched_call_connection_lost(self, exc):
            try:
                _orig_call_connection_lost(self, exc)
            except (ConnectionResetError, ConnectionAbortedError, OSError):
                pass
        _ProactorBasePipeTransport._call_connection_lost = _patched_call_connection_lost
    except Exception:
        pass

import os
import shutil
import tempfile
import traceback
import uuid
import time
import base64
import urllib.request
from urllib.parse import urlparse
from typing import List, Optional

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover
    load_dotenv = None

from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from pydantic import BaseModel

from pipeline import render_video
from config import WIDTH, HEIGHT
from helpers import preprocess_cover, preprocess_fit, prepare_logo, bake_logo_on_image
from cloudinary_uploader import maybe_upload_video_to_cloudinary

if load_dotenv:
    load_dotenv()

app = FastAPI(title="Maati Video Generator")

# CORS: allow your frontend to call this API from another origin.
# Configure via env: CORS_ORIGINS="https://example.com,https://foo.com"
_cors_origins = os.getenv("CORS_ORIGINS", "*").strip()
if _cors_origins == "*":
    allow_origins = ["*"]
    allow_credentials = False
else:
    allow_origins = [o.strip() for o in _cors_origins.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store (simple, single-instance).
JOBS = {}
JOB_TTL_SECONDS = 15 * 60


class RenderFromUrlsRequest(BaseModel):
    template: str = "A"
    logo_url: Optional[str] = None
    intro_logo_url: Optional[str] = None
    farmer_img_url: str
    farm_img_url: str
    process_image_urls: List[str]
    certificate_img_url: Optional[str] = None
    end_img_url: Optional[str] = None


def _cleanup_jobs():
    now = int(time.time())
    to_delete = []
    for job_id, job in JOBS.items():
        finished = job.get("finished_at")
        if finished and now - finished > JOB_TTL_SECONDS:
            to_delete.append(job_id)
    for job_id in to_delete:
        JOBS.pop(job_id, None)

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Farm Trace Video Generator</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --soil: #3d2b1f;
    --clay: #8b5e3c;
    --wheat: #e8c97e;
    --moss: #4a7c59;
    --moss-light: #6aab79;
    --cream: #faf6ef;
    --parchment: #f0e8d5;
    --shadow: rgba(61,43,31,0.15);
    --border: rgba(139,94,60,0.25);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background-color: var(--cream);
    background-image:
      radial-gradient(ellipse at 10% 20%, rgba(232,201,126,0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 80%, rgba(74,124,89,0.12) 0%, transparent 50%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b5e3c' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .card {
    background: white;
    border-radius: 20px;
    width: 100%;
    max-width: 780px;
    box-shadow: 0 4px 6px var(--shadow), 0 20px 60px rgba(61,43,31,0.1);
    overflow: hidden;
    animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    transform: translateY(24px);
  }

  @keyframes rise {
    to { opacity: 1; transform: translateY(0); }
  }

  .header {
    background: linear-gradient(135deg, var(--soil) 0%, #5a3825 60%, var(--clay) 100%);
    padding: 36px 44px;
    position: relative;
    overflow: hidden;
  }

  .header::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(232,201,126,0.12);
  }

  .header::after {
    content: '';
    position: absolute;
    bottom: -20px; left: 30%;
    width: 100px; height: 100px;
    border-radius: 50%;
    background: rgba(74,124,89,0.15);
  }

  .header-tag {
    display: inline-block;
    background: rgba(232,201,126,0.2);
    border: 1px solid rgba(232,201,126,0.4);
    color: var(--wheat);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  .header h1 {
    font-family: 'Playfair Display', serif;
    font-size: 34px;
    font-weight: 700;
    color: white;
    line-height: 1.15;
    position: relative;
    z-index: 1;
  }

  .header h1 span {
    color: var(--wheat);
  }

  .header p {
    color: rgba(255,255,255,0.65);
    margin-top: 8px;
    font-size: 14px;
    font-weight: 300;
    letter-spacing: 0.3px;
    position: relative;
    z-index: 1;
  }

  .leaf-icon {
    position: absolute;
    top: 24px; right: 44px;
    font-size: 52px;
    opacity: 0.18;
    z-index: 1;
  }

  .body {
    padding: 36px 44px 44px;
  }

  .template-section {
    margin-bottom: 32px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--clay);
    margin-bottom: 10px;
  }

  .template-select-wrapper {
    position: relative;
  }

  .template-select-wrapper select {
    width: 100%;
    padding: 13px 44px 13px 16px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: var(--parchment);
    color: var(--soil);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    appearance: none;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }

  .template-select-wrapper select:focus {
    border-color: var(--moss);
    box-shadow: 0 0 0 3px rgba(74,124,89,0.12);
  }

  .template-select-wrapper::after {
    content: '▾';
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--clay);
    pointer-events: none;
    font-size: 14px;
  }

  .upload-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .upload-item {
    position: relative;
    animation: fadeUp 0.5s ease forwards;
    opacity: 0;
  }

  .upload-item:nth-child(1) { animation-delay: 0.05s; }
  .upload-item:nth-child(2) { animation-delay: 0.1s; }
  .upload-item:nth-child(3) { animation-delay: 0.15s; }
  .upload-item:nth-child(4) { animation-delay: 0.2s; }
  .upload-item:nth-child(5) { animation-delay: 0.25s; }
  .upload-item:nth-child(6) { animation-delay: 0.3s; }
  .upload-item:nth-child(7) { animation-delay: 0.35s; }

  .upload-item.full-width {
    grid-column: span 2;
  }

  @keyframes fadeUp {
    to { opacity: 1; transform: none; }
    from { opacity: 0; transform: translateY(10px); }
  }

  .upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1.5px dashed var(--border);
    border-radius: 12px;
    padding: 22px 16px;
    background: var(--parchment);
    cursor: pointer;
    transition: all 0.22s ease;
    text-align: center;
    min-height: 110px;
  }

  .upload-label:hover {
    border-color: var(--moss);
    background: rgba(74,124,89,0.06);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74,124,89,0.12);
  }

  .upload-label.has-file {
    border-style: solid;
    border-color: var(--moss);
    background: rgba(74,124,89,0.07);
  }

  .upload-icon {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 8px var(--shadow);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .upload-label:hover .upload-icon {
    transform: scale(1.1);
  }

  .upload-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--soil);
  }

  .upload-hint {
    font-size: 11px;
    color: var(--clay);
    opacity: 0.75;
  }

  .file-chosen {
    font-size: 11px;
    color: var(--moss);
    font-weight: 500;
    margin-top: 2px;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  input[type="file"] { display: none; }

  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--border), transparent);
    margin: 28px 0;
  }

  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .btn-generate {
    flex: 1;
    padding: 15px 24px;
    background: linear-gradient(135deg, var(--moss) 0%, var(--moss-light) 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.3px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.22s ease;
    box-shadow: 0 4px 16px rgba(74,124,89,0.35);
  }

  .btn-generate:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(74,124,89,0.45);
  }

  .btn-generate:active { transform: translateY(0); }

  .btn-generate:disabled {
    opacity: 0.75;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-cancel {
    padding: 15px 24px;
    background: transparent;
    color: var(--clay);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.22s ease;
  }

  .btn-cancel:hover {
    background: var(--parchment);
    border-color: var(--clay);
  }

  .btn-cancel:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .progress-bar {
    height: 3px;
    background: var(--parchment);
    border-radius: 99px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, var(--moss), var(--wheat));
    border-radius: 99px;
    transition: width 0.4s ease;
  }

  .progress-text {
    font-size: 12px;
    color: var(--clay);
    text-align: right;
    margin-top: -20px;
    margin-bottom: 22px;
  }

  .render-progress {
    margin-top: 10px;
  }

  .render-progress .progress-text {
    margin-top: -18px;
    margin-bottom: 18px;
  }

  .status {
    margin-top: 14px;
    font-size: 13px;
    color: var(--clay);
    min-height: 18px;
  }

  .video {
    margin-top: 18px;
    display: none;
  }

  .video video {
    width: 100%;
    border-radius: 14px;
    background: #000;
  }

  .download-link {
    display: inline-block;
    margin-top: 10px;
    padding: 10px 14px;
    background: var(--soil);
    color: #fff;
    text-decoration: none;
    border-radius: 10px;
    font-size: 13px;
  }

  @media (max-width: 720px) {
    .upload-grid { grid-template-columns: 1fr; }
    .upload-item.full-width { grid-column: span 1; }
    .header, .body { padding: 28px; }
    .actions { flex-direction: column; }
    .btn-generate, .btn-cancel { width: 100%; }
  }
</style>
</head>
<body>

<div class="card">
  <div class="header">
    <div class="header-tag">🌱 Farm Traceability</div>
    <h1>Farm Trace <span>Video</span> Generator</h1>
    <p>Upload images, choose a template, and generate a traceability video.</p>
    <div class="leaf-icon">🎬</div>
  </div>

  <div class="body">
    <form id="renderForm">
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      <p class="progress-text" id="progressText">0 of 7 files uploaded</p>
      <div class="render-progress">
        <div class="progress-bar"><div class="progress-fill" id="renderProgressFill"></div></div>
        <p class="progress-text" id="renderProgressText">Render progress: 0%</p>
      </div>

      <div class="template-section">
        <div class="section-label">Select Template</div>
        <div class="template-select-wrapper">
          <select id="templateSelect" name="template">
            <option value="A">Template A</option>
            <option value="B">Template B</option>
            <option value="C">Template C</option>
          </select>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section-label" style="margin-bottom:14px;">Media Assets</div>
      <div class="upload-grid">
        <div class="upload-item">
          <input type="file" id="logo" name="logo" accept="image/*" onchange="handleFile(this,'logoLabel','logoFile')" required>
          <label class="upload-label" id="logoLabel" for="logo">
            <div class="upload-icon">🏷️</div>
            <span class="upload-name">Logo</span>
            <span class="upload-hint">Brand mark / PNG</span>
            <span class="file-chosen" id="logoFile"></span>
          </label>
        </div>

        <div class="upload-item">
          <input type="file" id="introLogo" name="intro_logo" accept="image/*" onchange="handleFile(this,'introLogoLabel','introLogoFile')" required>
          <label class="upload-label" id="introLogoLabel" for="introLogo">
            <div class="upload-icon">🎞️</div>
            <span class="upload-name">Intro Logo</span>
            <span class="upload-hint">Opening sequence</span>
            <span class="file-chosen" id="introLogoFile"></span>
          </label>
        </div>

        <div class="upload-item">
          <input type="file" id="farmerImg" name="farmer_img" accept="image/*" onchange="handleFile(this,'farmerLabel','farmerFile')" required>
          <label class="upload-label" id="farmerLabel" for="farmerImg">
            <div class="upload-icon">👨‍🌾</div>
            <span class="upload-name">Farmer Image</span>
            <span class="upload-hint">Portrait preferred</span>
            <span class="file-chosen" id="farmerFile"></span>
          </label>
        </div>

        <div class="upload-item">
          <input type="file" id="farmImg" name="farm_img" accept="image/*" onchange="handleFile(this,'farmLabel','farmFile')" required>
          <label class="upload-label" id="farmLabel" for="farmImg">
            <div class="upload-icon">🌾</div>
            <span class="upload-name">Farm Image</span>
            <span class="upload-hint">Landscape / wide shot</span>
            <span class="file-chosen" id="farmFile"></span>
          </label>
        </div>

        <div class="upload-item">
          <input type="file" id="processImgs" name="process_images" accept="image/*" multiple onchange="handleFile(this,'processLabel','processFile')" required>
          <label class="upload-label" id="processLabel" for="processImgs">
            <div class="upload-icon">⚙️</div>
            <span class="upload-name">Process Images</span>
            <span class="upload-hint">Multiple files allowed</span>
            <span class="file-chosen" id="processFile"></span>
          </label>
        </div>

        <div class="upload-item">
          <input type="file" id="certImg" name="certificate_img" accept="image/*" onchange="handleFile(this,'certLabel','certFile')" required>
          <label class="upload-label" id="certLabel" for="certImg">
            <div class="upload-icon">📜</div>
            <span class="upload-name">Certificate Image</span>
            <span class="upload-hint">Organic / quality cert</span>
            <span class="file-chosen" id="certFile"></span>
          </label>
        </div>

        <div class="upload-item full-width">
          <input type="file" id="thankYouImg" name="end_img" accept="image/*" onchange="handleFile(this,'thankYouLabel','thankYouFile')" required>
          <label class="upload-label" id="thankYouLabel" for="thankYouImg" style="flex-direction:row; min-height:80px; gap:14px;">
            <div class="upload-icon">🙏</div>
            <div style="text-align:left;">
              <div class="upload-name">Thank You Image</div>
              <div class="upload-hint">Closing card for video</div>
              <div class="file-chosen" id="thankYouFile"></div>
            </div>
          </label>
        </div>
      </div>

      <div class="divider"></div>

      <div class="actions">
        <button class="btn-generate" id="submitBtn" type="submit">
          <span>▶</span> Generate Video
        </button>
        <button class="btn-cancel" id="cancelBtn" type="button" disabled>Cancel</button>
      </div>
      <div class="status" id="status"></div>
    </form>

    <div class="video" id="videoWrap">
      <video id="video" controls></video>
      <a class="download-link" id="downloadLink" href="#" download>Download Video</a>
    </div>
  </div>
</div>

<script>
  let uploadedCount = 0;
  const totalFiles = 7;
  let currentJob = null;
  let rendering = false;

  const form = document.getElementById('renderForm');
  const statusEl = document.getElementById('status');
  const submitBtn = document.getElementById('submitBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const videoWrap = document.getElementById('videoWrap');
  const videoEl = document.getElementById('video');
  const downloadLink = document.getElementById('downloadLink');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const renderProgressFill = document.getElementById('renderProgressFill');
  const renderProgressText = document.getElementById('renderProgressText');

  function updateUploadProgress() {
    if (rendering) return;
    const pct = Math.round((uploadedCount / totalFiles) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = `${uploadedCount} of ${totalFiles} files uploaded`;
    renderProgressFill.style.width = '0%';
    renderProgressText.textContent = 'Render progress: 0%';
  }

  function handleFile(input, labelId, fileTextId) {
    const label = document.getElementById(labelId);
    const fileText = document.getElementById(fileTextId);
    if (input.files && input.files.length > 0) {
      if (!label.classList.contains('has-file')) {
        uploadedCount++;
        label.classList.add('has-file');
      }
      const names = Array.from(input.files).map(f => f.name);
      fileText.textContent = names.length > 1 ? `${names.length} files selected` : names[0];
      updateUploadProgress();
    }
  }

  async function cancelJob() {
    if (!currentJob) return;
    try {
      await fetch(`/cancel/${currentJob}`, { method: 'POST' });
      statusEl.textContent = 'Cancelled.';
    } catch (err) {
      statusEl.textContent = 'Cancel failed.';
    } finally {
      cancelBtn.disabled = true;
      rendering = false;
      updateUploadProgress();
    }
  }

  cancelBtn.addEventListener('click', cancelJob);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Uploading and rendering... this can take a minute.';
    submitBtn.disabled = true;
    cancelBtn.disabled = false;
    videoWrap.style.display = 'none';
    rendering = true;

    renderProgressFill.style.width = '0%';
    renderProgressText.textContent = 'Render progress: 0%';

    const formData = new FormData(form);
    try {
      const res = await fetch('/render', { method: 'POST', body: formData });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Render failed');
      }
      const data = await res.json();
      const jobId = data.job_id;
      if (!jobId) throw new Error('No job id returned');
      currentJob = jobId;

      const poll = async () => {
        const sres = await fetch(`/status/${jobId}`);
        if (!sres.ok) throw new Error('Status check failed');
        const sdata = await sres.json();
        if (sdata.status === 'done') {
          const url = sdata.download_url;
          videoEl.src = url;
          downloadLink.href = url;
          downloadLink.download = `maati_video_${Date.now()}.mp4`;
          videoWrap.style.display = 'block';
          statusEl.textContent = 'Done.';
          renderProgressFill.style.width = '100%';
          renderProgressText.textContent = 'Render complete';
          cancelBtn.disabled = true;
          rendering = false;
          return;
        }
        if (sdata.status === 'error') {
          cancelBtn.disabled = true;
          rendering = false;
          throw new Error(sdata.error || 'Render failed');
        }
        if (sdata.status === 'cancelled') {
          cancelBtn.disabled = true;
          rendering = false;
          statusEl.textContent = 'Cancelled.';
          renderProgressText.textContent = 'Render cancelled';
          return;
        }
        const pct = sdata.progress || 0;
        renderProgressFill.style.width = `${pct}%`;
        renderProgressText.textContent = `Rendering... ${pct}% ${sdata.stage ? '(' + sdata.stage + ')' : ''}`;
        setTimeout(poll, 2000);
      };
      poll();
    } catch (err) {
      rendering = false;
      statusEl.textContent = 'Error: ' + err.message;
      updateUploadProgress();
    } finally {
      submitBtn.disabled = false;
      if (!rendering) {
        cancelBtn.disabled = true;
      }
    }
  });
</script>
</body>
</html>
"""


def _save_upload(upload: UploadFile, dir_path: str, prefix: str | None = None) -> str:
    safe_name = upload.filename
    if prefix:
        safe_name = f"{prefix}_{safe_name}"
    path = os.path.join(dir_path, safe_name)
    with open(path, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return path


def _default_logo_path() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "Maati AI logo.png"))


def _ext_from_content_type(content_type: str | None) -> str:
    value = (content_type or "").split(";")[0].strip().lower()
    if value == "image/png":
        return ".png"
    if value == "image/webp":
        return ".webp"
    if value == "image/gif":
        return ".gif"
    if value in ("image/jpeg", "image/jpg"):
        return ".jpg"
    return ".jpg"


def _safe_download_name(source: str, prefix: str, content_type: str | None = None) -> str:
    parsed = urlparse(source)
    base = os.path.basename(parsed.path or "").strip()
    if not base or "." not in base:
        base = f"{prefix}{_ext_from_content_type(content_type)}"
    safe = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in base)
    return f"{prefix}_{safe}" if not safe.startswith(prefix) else safe


def _save_image_source(source: str | None, dir_path: str, prefix: str, fallback_path: str | None = None) -> str:
    value = (source or "").strip()
    if not value and fallback_path:
        dst = os.path.join(dir_path, f"{prefix}_{os.path.basename(fallback_path)}")
        shutil.copyfile(fallback_path, dst)
        return dst
    if not value:
        raise ValueError(f"{prefix} image is required")

    if value.startswith("data:image/"):
        header, encoded = value.split(",", 1)
        content_type = header.split(":", 1)[1].split(";", 1)[0]
        path = os.path.join(dir_path, f"{prefix}{_ext_from_content_type(content_type)}")
        with open(path, "wb") as f:
            f.write(base64.b64decode(encoded))
        return path

    parsed = urlparse(value)
    if parsed.scheme in ("http", "https"):
        req = urllib.request.Request(value, headers={"User-Agent": "MaatiVideoGenerator/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            content_type = response.headers.get("Content-Type")
            if content_type and not content_type.lower().startswith("image/"):
                raise ValueError(f"{prefix} URL is not an image")
            filename = _safe_download_name(value, prefix, content_type)
            path = os.path.join(dir_path, filename)
            with open(path, "wb") as f:
                shutil.copyfileobj(response, f)
        return path

    if value.startswith("/"):
        local_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", value.lstrip("/")))
    else:
        local_path = os.path.abspath(value)
    if os.path.exists(local_path):
        dst = os.path.join(dir_path, f"{prefix}_{os.path.basename(local_path)}")
        shutil.copyfile(local_path, dst)
        return dst

    if fallback_path and os.path.exists(fallback_path):
        dst = os.path.join(dir_path, f"{prefix}_{os.path.basename(fallback_path)}")
        shutil.copyfile(fallback_path, dst)
        return dst

    raise ValueError(f"Unable to load {prefix} image")


def _cleanup_dir(path: str):
    try:
        shutil.rmtree(path, ignore_errors=True)
    except Exception:
        pass


def _should_reverse_by_name(names):
    nums = []
    for name in names:
        stem = os.path.splitext(os.path.basename(name))[0]
        if not stem.isdigit():
            return False
        nums.append(int(stem))
    if len(nums) < 2:
        return False
    return all(nums[i] > nums[i + 1] for i in range(len(nums) - 1))


def _preprocess_inputs(paths: dict, work_dir: str) -> dict:
    """
    Create pre-resized copies to reduce memory usage during MoviePy rendering.
    Falls back to original paths if preprocessing fails.
    """
    pre_dir = os.path.join(work_dir, "preprocessed")
    os.makedirs(pre_dir, exist_ok=True)

    def _dst(name):
        return os.path.join(pre_dir, f"{name}.jpg")

    processed = dict(paths)

    # Prepare a small RGBA logo once (for overlays and baking).
    logo_small = prepare_logo(paths["logo"], os.path.join(pre_dir, "logo_small.png"), height=60)
    processed["logo"] = logo_small
    processed["baked_logo"] = True

    intro_base = preprocess_cover(paths["intro_logo"], _dst("intro_logo"), WIDTH, HEIGHT)
    processed["intro_logo"] = bake_logo_on_image(intro_base, logo_small, _dst("intro_logo_baked"))

    processed["farmer_img"] = preprocess_cover(paths["farmer_img"], _dst("farmer_img"), WIDTH // 2, HEIGHT)
    processed["farm_img"] = preprocess_cover(paths["farm_img"], _dst("farm_img"), WIDTH // 2, HEIGHT)

    cert_base = preprocess_cover(paths["certificate_img"], _dst("certificate_img"), WIDTH, HEIGHT)
    processed["certificate_img"] = bake_logo_on_image(cert_base, logo_small, _dst("certificate_baked"))

    end_base = preprocess_cover(paths["end_img"], _dst("end_img"), WIDTH, HEIGHT)
    processed["end_img"] = bake_logo_on_image(end_base, logo_small, _dst("end_baked"))

    processed["process_images"] = []
    for i, p in enumerate(paths["process_images"]):
        base = preprocess_cover(p, _dst(f"process_{i}"), WIDTH, HEIGHT)
        baked = bake_logo_on_image(base, logo_small, _dst(f"process_{i}_baked"))
        processed["process_images"].append(baked)

    return processed


@app.get("/health")
def health():
    return {"ok": True}

@app.get("/")
def index():
    return HTMLResponse(INDEX_HTML)


def _run_job(job_id, work_dir, output_dir, template, paths):
    try:
        def progress_cb(pct, stage):
            JOBS[job_id]["progress"] = pct
            JOBS[job_id]["stage"] = stage

        def is_cancelled():
            return JOBS.get(job_id, {}).get("cancel", False)

        output_path = render_video(
            paths["logo"],
            paths["intro_logo"],
            paths["farmer_img"],
            paths["farm_img"],
            paths["process_images"],
            paths["certificate_img"],
            paths["end_img"],
            template_name=template,
            output_root=output_dir,
            progress_cb=progress_cb,
            is_cancelled=is_cancelled,
            baked_logo=bool(paths.get("baked_logo")),
        )

        try:
            public_id = f"maati_{job_id}"
            folder = os.getenv("CLOUDINARY_FOLDER", "maati_videos")
            upload_res = maybe_upload_video_to_cloudinary(
                output_path,
                folder=folder,
                public_id=public_id,
                tags=["maati", "video", f"template_{template}"],
            )
            if upload_res:
                JOBS[job_id]["cloudinary_url"] = upload_res.secure_url
                JOBS[job_id]["cloudinary_public_id"] = upload_res.public_id
        except Exception as e:
            # Do not fail the whole render if cloud upload fails.
            JOBS[job_id]["cloudinary_error"] = str(e)

        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["output_path"] = output_path
        JOBS[job_id]["finished_at"] = int(time.time())
    except Exception as e:
        print("Render error:", flush=True)
        traceback.print_exc()
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error"] = str(e)
        JOBS[job_id]["trace"] = traceback.format_exc()
        JOBS[job_id]["finished_at"] = int(time.time())
    finally:
        _cleanup_dir(work_dir)


def _create_job():
    job_id = uuid.uuid4().hex
    JOBS[job_id] = {
        "status": "queued",
        "output_path": None,
        "cloudinary_url": None,
        "cloudinary_public_id": None,
        "cloudinary_error": None,
        "progress": 0,
        "stage": "queued",
        "cancel": False,
    }
    return job_id


def _prepare_and_run_url_job(job_id, work_dir, output_dir, template, payload: RenderFromUrlsRequest):
    try:
        if JOBS.get(job_id, {}).get("cancel"):
            return

        default_logo = _default_logo_path()
        process_urls = [u for u in (payload.process_image_urls or []) if str(u or "").strip()]
        if not process_urls:
            raise ValueError("At least one process image URL is required")

        JOBS[job_id]["status"] = "processing"
        JOBS[job_id]["progress"] = 3
        JOBS[job_id]["stage"] = "downloading images"

        paths = {
            "logo": _save_image_source(payload.logo_url, work_dir, "logo", fallback_path=default_logo),
            "intro_logo": _save_image_source(payload.intro_logo_url, work_dir, "intro_logo", fallback_path=default_logo),
            "farmer_img": _save_image_source(payload.farmer_img_url, work_dir, "farmer_img"),
            "farm_img": _save_image_source(payload.farm_img_url, work_dir, "farm_img"),
            "certificate_img": _save_image_source(payload.certificate_img_url or process_urls[-1], work_dir, "certificate_img"),
            "end_img": _save_image_source(payload.end_img_url or process_urls[-1], work_dir, "end_img"),
            "process_images": [
                _save_image_source(url, work_dir, f"process_{i:03d}")
                for i, url in enumerate(process_urls)
            ],
        }

        max_process = int(os.getenv("MAX_PROCESS_IMAGES", "12"))
        if max_process > 0 and len(paths["process_images"]) > max_process:
            paths["process_images"] = paths["process_images"][:max_process]

        JOBS[job_id]["progress"] = 10
        JOBS[job_id]["stage"] = "preprocessing images"
        paths = _preprocess_inputs(paths, work_dir)
        _run_job(job_id, work_dir, output_dir, template, paths)
    except Exception as e:
        print("Render URL job error:", flush=True)
        traceback.print_exc()
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error"] = str(e)
        JOBS[job_id]["trace"] = traceback.format_exc()
        JOBS[job_id]["finished_at"] = int(time.time())
        _cleanup_dir(work_dir)


@app.post("/render")
async def render(
    background_tasks: BackgroundTasks,
    template: str = Form("A"),
    logo: UploadFile = File(...),
    intro_logo: UploadFile = File(...),
    farmer_img: UploadFile = File(...),
    farm_img: UploadFile = File(...),
    process_images: List[UploadFile] = File(...),
    certificate_img: UploadFile = File(...),
    end_img: UploadFile = File(...),
):
    _cleanup_jobs()
    template = template.strip().upper() or "A"
    if template not in ("A", "B", "C"):
        return JSONResponse({"error": "Invalid template. Use A, B, or C."}, status_code=400)

    work_dir = tempfile.mkdtemp(prefix="maati_")
    output_dir = os.getenv("OUTPUT_ROOT", os.path.join(os.getcwd(), "output"))
    os.makedirs(output_dir, exist_ok=True)

    job_id = _create_job()

    try:
        # Some browsers/OS file pickers return multi-select files in reverse order.
        # PROCESS_REVERSE can be: "1" (force reverse), "0" (never), "auto" (default).
        reverse_mode = os.getenv("PROCESS_REVERSE", "auto").strip().lower()
        if reverse_mode in ("1", "true", "yes"):
            process_images = list(reversed(process_images))
        elif reverse_mode == "auto":
            names = [p.filename for p in process_images]
            if _should_reverse_by_name(names):
                process_images = list(reversed(process_images))
        paths = {
            "logo": _save_upload(logo, work_dir),
            "intro_logo": _save_upload(intro_logo, work_dir),
            "farmer_img": _save_upload(farmer_img, work_dir),
            "farm_img": _save_upload(farm_img, work_dir),
            "certificate_img": _save_upload(certificate_img, work_dir),
            "end_img": _save_upload(end_img, work_dir),
            "process_images": [
                _save_upload(p, work_dir, prefix=f"{i:03d}")
                for i, p in enumerate(process_images)
            ],
        }
        max_process = int(os.getenv("MAX_PROCESS_IMAGES", "12"))
        if max_process > 0 and len(paths["process_images"]) > max_process:
            paths["process_images"] = paths["process_images"][:max_process]
        paths = _preprocess_inputs(paths, work_dir)
    except Exception as e:
        _cleanup_dir(work_dir)
        return JSONResponse({"error": str(e)}, status_code=500)

    JOBS[job_id]["status"] = "processing"
    background_tasks.add_task(_run_job, job_id, work_dir, output_dir, template, paths)
    return JSONResponse({"job_id": job_id})


@app.post("/render-from-urls")
async def render_from_urls(payload: RenderFromUrlsRequest, background_tasks: BackgroundTasks):
    _cleanup_jobs()
    template = (payload.template or "A").strip().upper()
    if template not in ("A", "B", "C"):
        return JSONResponse({"error": "Invalid template. Use A, B, or C."}, status_code=400)

    process_urls = [u for u in (payload.process_image_urls or []) if str(u or "").strip()]
    if not process_urls:
        return JSONResponse({"error": "process_image_urls is required"}, status_code=400)

    work_dir = tempfile.mkdtemp(prefix="maati_")
    output_dir = os.getenv("OUTPUT_ROOT", os.path.join(os.getcwd(), "output"))
    os.makedirs(output_dir, exist_ok=True)

    job_id = _create_job()
    JOBS[job_id]["stage"] = "queued url render"
    background_tasks.add_task(_prepare_and_run_url_job, job_id, work_dir, output_dir, template, payload)
    return JSONResponse({"job_id": job_id})


@app.get("/status/{job_id}")
def status(job_id: str):
    _cleanup_jobs()
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse({"error": "job not found"}, status_code=404)
    resp = {"status": job["status"], "progress": job.get("progress", 0), "stage": job.get("stage", "")}
    if job["status"] == "done":
        resp["download_url"] = f"/download/{job_id}"
        if job.get("cloudinary_url"):
            resp["cloudinary_url"] = job.get("cloudinary_url")
        if job.get("cloudinary_error"):
            resp["cloudinary_error"] = job.get("cloudinary_error")
    if job["status"] == "error":
        resp["error"] = job.get("error")
    return JSONResponse(resp)


@app.post("/cancel/{job_id}")
def cancel(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse({"error": "job not found"}, status_code=404)
    if job["status"] in ("done", "error"):
        return JSONResponse({"status": job["status"]})
    job["cancel"] = True
    job["status"] = "cancelled"
    job["finished_at"] = int(time.time())
    return JSONResponse({"status": "cancelled"})


@app.get("/download/{job_id}")
def download(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse({"error": "job not found"}, status_code=404)
    if job["status"] != "done" or not job.get("output_path"):
        return JSONResponse({"error": "not ready"}, status_code=409)
    return FileResponse(
        job["output_path"],
        media_type="video/mp4",
        filename=os.path.basename(job["output_path"]),
    )
