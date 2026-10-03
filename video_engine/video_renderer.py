import os
import uuid
import logging
from typing import Dict, Any, List, Optional
from .clip_extractor import extract_clip
from .aspect_ratio_converter import convert_aspect_ratio
from .subtitle_generator import generate_ass, generate_srt, burn_subtitles
from .ffmpeg_utils import generate_thumbnail, probe_video

logger = logging.getLogger("video_engine.video_renderer")

def render_clip_from_spec(spec: Dict[str, Any], temp_dir: str = "storage/temp") -> Dict[str, Any]:
    """
    Renders a short-form video clip from an edit specification.
    
    spec format:
    {
        "source_path": str,
        "output_path": str,
        "start_time": float,
        "end_time": float,
        "aspect_ratio": "9:16" | "16:9" | "1:1",
        "captions_enabled": bool,
        "caption_style": "bold_yellow" | "neon_cyan" | "clean_white",
        "segments": List[{"start": float, "end": float, "text": str}],
        "thumbnail_path": Optional[str]
    }
    """
    source_path = spec.get("source_path")
    if not source_path or not os.path.exists(source_path):
        raise FileNotFoundError(f"Source video path not found: {source_path}")
        
    start_time = float(spec.get("start_time", 0.0))
    end_time = float(spec.get("end_time", 10.0))
    aspect_ratio = spec.get("aspect_ratio", "9:16")
    captions_enabled = bool(spec.get("captions_enabled", True))
    caption_style = spec.get("caption_style", "bold_yellow")
    segments = spec.get("segments", [])
    output_path = spec.get("output_path")
    thumbnail_path = spec.get("thumbnail_path")
    
    if not output_path:
        os.makedirs("storage/clips", exist_ok=True)
        output_path = f"storage/clips/clip_{uuid.uuid4().hex[:8]}.mp4"
        
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_cut = os.path.join(temp_dir, f"cut_{uuid.uuid4().hex[:8]}.mp4")
    temp_aspect = os.path.join(temp_dir, f"aspect_{uuid.uuid4().hex[:8]}.mp4")
    temp_sub = os.path.join(temp_dir, f"sub_{uuid.uuid4().hex[:8]}.ass")
    
    try:
        # Step 1: Extract clip time range
        logger.info(f"[Renderer] Step 1: Cutting {start_time}s -> {end_time}s")
        extract_clip(source_path, temp_cut, start_time, end_time)
        
        # Step 2: Convert Aspect Ratio
        logger.info(f"[Renderer] Step 2: Converting to aspect ratio {aspect_ratio}")
        convert_aspect_ratio(temp_cut, temp_aspect, target_ratio=aspect_ratio, style="blur_bg")
        
        # Step 3: Subtitles / Captions
        if captions_enabled and segments:
            logger.info(f"[Renderer] Step 3: Generating and burning {caption_style} subtitles")
            # Filter segments relevant to this clip
            clip_segments = [
                s for s in segments
                if float(s.get("end", 0.0)) >= start_time and float(s.get("start", 0.0)) <= end_time
            ]
            
            if clip_segments:
                generate_ass(
                    segments=clip_segments,
                    output_ass_path=temp_sub,
                    offset_seconds=start_time,
                    style_name=caption_style
                )
                burn_subtitles(temp_aspect, temp_sub, output_path)
            else:
                import shutil
                shutil.copy2(temp_aspect, output_path)
        else:
            logger.info("[Renderer] Step 3: Subtitles disabled, writing output directly")
            import shutil
            shutil.copy2(temp_aspect, output_path)
            
        # Step 4: Generate thumbnail
        if not thumbnail_path:
            thumbnail_path = output_path.replace(".mp4", "_thumb.jpg")
            
        try:
            generate_thumbnail(output_path, thumbnail_path, timestamp_sec=0.5)
        except Exception as e:
            logger.warning(f"Thumbnail generation warning: {e}")
            
        # Probe final video for metadata
        metadata = probe_video(output_path)
        metadata["output_path"] = output_path
        metadata["thumbnail_path"] = thumbnail_path
        metadata["duration"] = round(end_time - start_time, 2)
        metadata["aspect_ratio"] = aspect_ratio
        
        logger.info(f"[Renderer] Successfully generated clip: {output_path} ({metadata['duration']}s)")
        return metadata

    finally:
        # Clean temporary files
        for f in [temp_cut, temp_aspect, temp_sub]:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception:
                    pass
