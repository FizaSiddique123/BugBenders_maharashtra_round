import os
import subprocess
import logging
from .ffmpeg_utils import get_ffmpeg_path

logger = logging.getLogger("video_engine.clip_extractor")

def extract_clip(
    input_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    reencode: bool = True
) -> str:
    """
    Extracts a time segment from input_path and writes to output_path.
    start_time and end_time are in seconds.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video does not exist: {input_path}")
        
    duration = end_time - start_time
    if duration <= 0:
        raise ValueError(f"Invalid duration: start_time={start_time}, end_time={end_time}")
        
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    ffmpeg_exe = get_ffmpeg_path()
    
    # Accurate frame extraction with re-encoding
    if reencode:
        cmd = [
            ffmpeg_exe,
            "-y",
            "-ss", str(max(0.0, start_time)),
            "-i", input_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            "-avoid_negative_ts", "make_zero",
            output_path
        ]
    else:
        # Fast stream copy
        cmd = [
            ffmpeg_exe,
            "-y",
            "-ss", str(max(0.0, start_time)),
            "-i", input_path,
            "-t", str(duration),
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            output_path
        ]
        
    logger.info(f"Extracting clip: {start_time}s to {end_time}s -> {output_path}")
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if proc.returncode != 0:
        logger.error(f"FFmpeg extract_clip failed: {proc.stderr}")
        raise RuntimeError(f"FFmpeg error: {proc.stderr[:200]}")
        
    return output_path
