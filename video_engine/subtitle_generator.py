import os
import subprocess
import logging
from typing import List, Dict, Any
from .ffmpeg_utils import get_ffmpeg_path

logger = logging.getLogger("video_engine.subtitle_generator")

def format_timestamp_srt(seconds: float) -> str:
    """Formats seconds to SRT format: HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def format_timestamp_ass(seconds: float) -> str:
    """Formats seconds to ASS format: H:MM:SS.cc"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"

def generate_srt(segments: List[Dict[str, Any]], output_srt_path: str, offset_seconds: float = 0.0) -> str:
    """
    Generates an SRT subtitle file from timestamped transcript segments.
    offset_seconds subtracts start_time when generating subtitles for a sub-clip.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_srt_path)), exist_ok=True)
    lines = []
    
    idx = 1
    for seg in segments:
        start = max(0.0, float(seg.get("start", 0.0)) - offset_seconds)
        end = max(start + 0.5, float(seg.get("end", start + 2.0)) - offset_seconds)
        text = str(seg.get("text", "")).strip()
        if not text:
            continue
            
        lines.append(str(idx))
        lines.append(f"{format_timestamp_srt(start)} --> {format_timestamp_srt(end)}")
        lines.append(text)
        lines.append("")
        idx += 1
        
    with open(output_srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        
    return output_srt_path


def generate_ass(
    segments: List[Dict[str, Any]],
    output_ass_path: str,
    offset_seconds: float = 0.0,
    style_name: str = "bold_yellow",
    video_w: int = 1080,
    video_h: int = 1920
) -> str:
    """
    Generates high-impact Advanced SubStation Alpha (ASS) subtitles
    with stylish typography, bold colors, and dark outlines.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_ass_path)), exist_ok=True)
    
    # Styles definition
    # Format: PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Outline, Shadow, Alignment, MarginV
    styles = {
        "bold_yellow": {
            "font": "Arial Black",
            "size": 52,
            "primary": "&H0000FFFF",  # Yellow in BGR (00 FFFF)
            "outline": "&H00000000",  # Black
            "border_style": 1,
            "outline_w": 4,
            "margin_v": 320,
            "alignment": 2  # Bottom Center
        },
        "neon_cyan": {
            "font": "Arial Black",
            "size": 50,
            "primary": "&H00FFFF00",  # Cyan in BGR
            "outline": "&H00000000",
            "border_style": 1,
            "outline_w": 4,
            "margin_v": 320,
            "alignment": 2
        },
        "clean_white": {
            "font": "Arial",
            "size": 48,
            "primary": "&H00FFFFFF",  # White
            "outline": "&H00111111",  # Dark grey
            "border_style": 1,
            "outline_w": 3,
            "margin_v": 300,
            "alignment": 2
        }
    }
    
    st = styles.get(style_name, styles["bold_yellow"])
    
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {video_w}
PlayResY: {video_h}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{st['font']},{st['size']},{st['primary']},&H000000FF,{st['outline']},&H00000000,-1,0,0,0,100,100,0,0,{st['border_style']},{st['outline_w']},2,{st['alignment']},40,40,{st['margin_v']},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for seg in segments:
        start = max(0.0, float(seg.get("start", 0.0)) - offset_seconds)
        end = max(start + 0.5, float(seg.get("end", start + 2.0)) - offset_seconds)
        text = str(seg.get("text", "")).strip().replace("\n", " ")
        if not text:
            continue
            
        # Uppercase bold text for modern creator style
        styled_text = f"{{\\b1}}{text.upper()}"
        events.append(f"Dialogue: 0,{format_timestamp_ass(start)},{format_timestamp_ass(end)},Default,,0,0,0,,{styled_text}")
        
    with open(output_ass_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events))
        
    return output_ass_path


def burn_subtitles(
    video_path: str,
    subtitle_path: str,
    output_path: str
) -> str:
    """
    Burns SRT/ASS subtitles into the video file using FFmpeg.
    Handles Windows path escaping for filter graph.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Input video not found: {video_path}")
    if not os.path.exists(subtitle_path):
        raise FileNotFoundError(f"Subtitle file not found: {subtitle_path}")
        
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    ffmpeg_exe = get_ffmpeg_path()
    
    # Path formatting for FFmpeg subtitles filter on Windows:
    # Must use forward slashes and escape colons: C\:/path/to/sub.ass
    norm_sub_path = os.path.abspath(subtitle_path).replace("\\", "/")
    if ":" in norm_sub_path:
        drive, rest = norm_sub_path.split(":", 1)
        norm_sub_path = f"{drive}\\:{rest}"
        
    if subtitle_path.endswith(".ass"):
        sub_filter = f"ass='{norm_sub_path}'"
    else:
        sub_filter = f"subtitles='{norm_sub_path}':force_style='FontSize=24,PrimaryColour=&H0000FFFF,BorderStyle=1,Outline=2'"
        
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-vf", sub_filter,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-c:a", "copy",
        "-pix_fmt", "yuv420p",
        output_path
    ]
    
    logger.info(f"Burning subtitles: {sub_filter} -> {output_path}")
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    if proc.returncode != 0:
        logger.warning(f"FFmpeg subtitle burning error: {proc.stderr[:300]}. Falling back to clean copy.")
        # If burning fails (e.g. font / libass missing in minimal ffmpeg build), copy cleanly without crashing
        import shutil
        shutil.copy2(video_path, output_path)
        
    return output_path
