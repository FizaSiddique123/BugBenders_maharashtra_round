import os
import json
import subprocess
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("video_engine.ffmpeg_utils")

def get_ffmpeg_path() -> str:
    """Returns the path to the ffmpeg executable."""
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(ffmpeg_exe):
            return ffmpeg_exe
    except Exception as e:
        logger.warning(f"imageio_ffmpeg lookup failed: {e}")
    
    # Fallback to system PATH
    return "ffmpeg"


def probe_video(video_path: str) -> Dict[str, Any]:
    """
    Probes video file to get duration, width, height, fps, bitrate.
    Uses ffmpeg -i info parsing if ffprobe is not installed.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    ffmpeg_exe = get_ffmpeg_path()
    
    # Run ffmpeg -i to parse stream and duration information
    cmd = [ffmpeg_exe, "-i", video_path]
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="ignore",
            timeout=15
        )
        output = proc.stderr
    except Exception as e:
        logger.error(f"Error running ffmpeg probe on {video_path}: {e}")
        return {"duration": 0.0, "width": 1920, "height": 1080, "fps": 30.0, "size_bytes": os.path.getsize(video_path)}

    duration = 0.0
    width = 1920
    height = 1080
    fps = 30.0
    
    try:
        # Parse Duration: 00:01:23.45
        import re
        dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", output)
        if dur_match:
            h, m, s = dur_match.groups()
            duration = int(h) * 3600 + int(m) * 60 + float(s)

        # Parse Stream ... Video: ..., 1920x1080 [SAR ...], 30 fps
        res_match = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", output)
        if res_match:
            width = int(res_match.group(1))
            height = int(res_match.group(2))

        fps_match = re.search(r"(\d+(?:\.\d+)?) fps", output)
        if fps_match:
            fps = float(fps_match.group(1))
    except Exception as e:
        logger.warning(f"Failed parsing ffmpeg probe regex: {e}")

    file_size = os.path.getsize(video_path)
    
    return {
        "duration": round(duration, 2),
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "size_bytes": file_size,
        "aspect_ratio": f"{width}:{height}"
    }


def generate_thumbnail(video_path: str, output_thumb_path: str, timestamp_sec: float = 1.0) -> str:
    """Generates a JPEG thumbnail from the video at the given timestamp."""
    os.makedirs(os.path.dirname(os.path.abspath(output_thumb_path)), exist_ok=True)
    ffmpeg_exe = get_ffmpeg_path()
    
    # -ss before -i for fast seek, scale to 720 width maintaining aspect ratio
    cmd = [
        ffmpeg_exe,
        "-y",
        "-ss", str(max(0.0, timestamp_sec)),
        "-i", video_path,
        "-vframes", "1",
        "-vf", "scale=720:-1",
        "-q:v", "2",
        output_thumb_path
    ]
    
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=15)
    except Exception as e:
        logger.error(f"Thumbnail generation failed: {e}")
        # If timestamp seek failed (e.g. video shorter than 1s), retry at 0.0s
        if timestamp_sec > 0:
            return generate_thumbnail(video_path, output_thumb_path, 0.0)
        raise
        
    return output_thumb_path


def create_sample_video(output_path: str, duration_sec: int = 30) -> str:
    """
    Creates a sample video with visual timer test pattern and sine tone audio
    for demo and testing without external uploads.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    ffmpeg_exe = get_ffmpeg_path()
    
    cmd = [
        ffmpeg_exe,
        "-y",
        "-f", "lavfi",
        "-i", f"testsrc=duration={duration_sec}:size=1920x1080:rate=30",
        "-f", "lavfi",
        "-i", f"sine=frequency=440:duration={duration_sec}",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        output_path
    ]
    
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if proc.returncode != 0:
        logger.error(f"Sample video creation failed: {proc.stderr}")
        raise RuntimeError(f"FFmpeg error: {proc.stderr[:200]}")
        
    return output_path

