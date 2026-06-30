import os
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class CloudinaryUploadResult:
    secure_url: str
    public_id: str
    resource_type: str
    bytes: int
    duration: Optional[float] = None


def _env_truthy(name: str, default: str = "0") -> bool:
    val = os.getenv(name, default)
    return str(val).strip().lower() in ("1", "true", "yes", "y", "on")


def cloudinary_enabled() -> bool:
    return _env_truthy("CLOUDINARY_ENABLED", "0")


def cloudinary_config_present() -> bool:
    # Cloudinary SDK supports either CLOUDINARY_URL or the 3 separate vars.
    if os.getenv("CLOUDINARY_URL"):
        return True
    if os.getenv("CLOUDINARY_CLOUD_NAME") and os.getenv("CLOUDINARY_API_KEY") and os.getenv("CLOUDINARY_API_SECRET"):
        return True
    return False


def maybe_upload_video_to_cloudinary(
    local_path: str,
    *,
    folder: Optional[str] = None,
    public_id: Optional[str] = None,
    tags: Optional[list[str]] = None,
) -> Optional[CloudinaryUploadResult]:
    """
    Uploads `local_path` to Cloudinary (resource_type=video) when enabled and configured.

    Controls (env):
      - CLOUDINARY_ENABLED=1 to enable upload
      - CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME (or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)
      - CLOUDINARY_FOLDER=maati_videos (optional default folder)
    """
    if not cloudinary_enabled():
        return None
    if not cloudinary_config_present():
        raise RuntimeError(
            "CLOUDINARY_ENABLED is set but credentials are missing. Set CLOUDINARY_URL or "
            "CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET."
        )

    try:
        import cloudinary  # type: ignore
        import cloudinary.uploader  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "Cloudinary SDK not installed. Add `cloudinary` to requirements and reinstall."
        ) from e

    # If CLOUDINARY_URL is set, cloudinary auto-configures. Otherwise configure explicitly.
    if not os.getenv("CLOUDINARY_URL"):
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True,
        )

    folder = (folder or os.getenv("CLOUDINARY_FOLDER") or "").strip() or None
    chunk_size = int(os.getenv("CLOUDINARY_CHUNK_SIZE", str(6 * 1024 * 1024)))  # 6MB

    options: Dict[str, Any] = {
        "resource_type": "video",
        "chunk_size": chunk_size,
    }
    if folder:
        options["folder"] = folder
    if public_id:
        options["public_id"] = public_id
    if tags:
        options["tags"] = tags

    # upload_large is safer for bigger mp4s; works for smaller files too.
    resp = cloudinary.uploader.upload_large(local_path, **options)
    return CloudinaryUploadResult(
        secure_url=resp["secure_url"],
        public_id=resp["public_id"],
        resource_type=resp.get("resource_type", "video"),
        bytes=int(resp.get("bytes") or 0),
        duration=resp.get("duration"),
    )

