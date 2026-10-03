"""
CreatorAI Video Engine
Handles FFmpeg operations, video probing, clip extraction, aspect ratio formatting,
subtitle generation/burning, and final MP4 rendering.
"""

from .ffmpeg_utils import get_ffmpeg_path, probe_video, generate_thumbnail, create_sample_video
from .clip_extractor import extract_clip
from .aspect_ratio_converter import convert_aspect_ratio
from .subtitle_generator import generate_srt, generate_ass, burn_subtitles
from .video_renderer import render_clip_from_spec

__all__ = [
    "get_ffmpeg_path",
    "probe_video",
    "generate_thumbnail",
    "create_sample_video",
    "extract_clip",
    "convert_aspect_ratio",
    "generate_srt",
    "generate_ass",
    "burn_subtitles",
    "render_clip_from_spec",
]
