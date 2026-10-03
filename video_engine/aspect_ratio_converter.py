import os
import subprocess
import logging
from .ffmpeg_utils import get_ffmpeg_path, probe_video

logger = logging.getLogger("video_engine.aspect_ratio_converter")

def convert_aspect_ratio(
    input_path: str,
    output_path: str,
    target_ratio: str = "9:16",
    style: str = "blur_bg"  # "blur_bg", "crop", "pad"
) -> str:
    """
    Converts video to desired aspect ratio: '9:16', '16:9', or '1:1'.
    
    Styles:
    - 'blur_bg': Scales blurred video as background, sharp original centered on top (Creator standard).
    - 'crop': Center crops video directly to aspect ratio.
    - 'pad': Adds black letterboxing/pillarboxing.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video does not exist: {input_path}")
        
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    ffmpeg_exe = get_ffmpeg_path()
    
    # Target dimensions
    ratio_map = {
        "9:16": (1080, 1920),
        "16:9": (1920, 1080),
        "1:1": (1080, 1080),
        "4:5": (1080, 1350)
    }
    
    target_w, target_h = ratio_map.get(target_ratio, (1080, 1920))
    
    if style == "blur_bg" and target_ratio == "9:16":
        # Professional blurred background with centered foreground
        filter_str = (
            f"[0:v]scale={target_w}:{target_h}:force_original_aspect_ratio=increase,"
            f"crop={target_w}:{target_h},boxblur=25:5[bg];"
            f"[0:v]scale={target_w}:{target_h}:force_original_aspect_ratio=decrease[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
        )
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", input_path,
            "-filter_complex", filter_str,
            "-map", "[outv]",
            "-map", "0:a?",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            output_path
        ]
    elif style == "crop":
        # Direct center crop
        filter_str = f"crop=ih*{target_w}/{target_h}:ih:(iw-ow)/2:0,scale={target_w}:{target_h}"
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", input_path,
            "-vf", filter_str,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            output_path
        ]
    else:
        # Default pad/letterbox
        filter_str = (
            f"scale={target_w}:{target_h}:force_original_aspect_ratio=decrease,"
            f"pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2:black"
        )
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i", input_path,
            "-vf", filter_str,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            output_path
        ]
        
    logger.info(f"Converting aspect ratio to {target_ratio} ({style}): {output_path}")
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if proc.returncode != 0:
        logger.error(f"FFmpeg aspect ratio conversion failed: {proc.stderr}")
        raise RuntimeError(f"FFmpeg aspect ratio conversion error: {proc.stderr[:200]}")
        
    return output_path
