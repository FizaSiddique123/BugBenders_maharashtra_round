import os
import json
import uuid
import logging
from ..database import get_db_connection
from ..config import SAMPLES_DIR, CLIPS_DIR
from video_engine.ffmpeg_utils import create_sample_video, generate_thumbnail, probe_video
from video_engine.video_renderer import render_clip_from_spec

logger = logging.getLogger("backend.sample_data")

def seed_sample_data():
    """Seeds starter projects, assets, transcripts, and generated demo clips."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if data already exists
    project_count = cursor.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    if project_count > 0:
        conn.close()
        return

    logger.info("Seeding initial CreatorAI demo projects, assets, and clips...")
    
    # 1. Projects
    projects = [
        {
            "id": "proj_demo_01",
            "title": "AI Content Repurposing Mastery",
            "description": "How to transform 1 long-form podcast into 10 viral short-form clips.",
            "status": "AI Analysis"
        },
        {
            "id": "proj_demo_02",
            "title": "10x Creator Growth Framework",
            "description": "Strategies for multi-platform distribution on Instagram, YouTube, and LinkedIn.",
            "status": "Clip Generated"
        },
        {
            "id": "proj_demo_03",
            "title": "Building a High-Retention Personal Brand",
            "description": "High engagement hooks, storytelling pacing, and audience retention.",
            "status": "Ready to Publish"
        }
    ]
    
    for p in projects:
        cursor.execute(
            "INSERT INTO projects (id, title, description, status) VALUES (?, ?, ?, ?)",
            (p["id"], p["title"], p["description"], p["status"])
        )
        
    # 2. Generate Master Demo Video if not present
    sample_video_path = os.path.join(SAMPLES_DIR, "creator_master_demo.mp4")
    thumb_path = os.path.join(SAMPLES_DIR, "creator_master_thumb.jpg")
    
    if not os.path.exists(sample_video_path):
        try:
            create_sample_video(sample_video_path, duration_sec=40)
            generate_thumbnail(sample_video_path, thumb_path, 1.0)
        except Exception as e:
            logger.warning(f"Could not generate sample video: {e}")

    meta = probe_video(sample_video_path) if os.path.exists(sample_video_path) else {"duration": 40.0, "size_bytes": 1000000}
    
    # 3. Create Demo Asset
    asset_id = "asset_demo_01"
    cursor.execute(
        """
        INSERT INTO assets (id, project_id, filename, filepath, file_type, duration, size_bytes, status, thumbnail_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            asset_id,
            "proj_demo_01",
            "creator_master_demo.mp4",
            sample_video_path,
            "video/mp4",
            meta.get("duration", 40.0),
            meta.get("size_bytes", 1000000),
            "ready",
            thumb_path
        )
    )
    
    # 4. Create Demo Transcript
    segments = [
        {"id": 1, "start": 0.0, "end": 6.5, "text": "Stop wasting 15 hours every single week manually cutting video clips."},
        {"id": 2, "start": 6.5, "end": 14.0, "text": "Most creators make the mistake of editing from scratch for every social platform."},
        {"id": 3, "start": 14.0, "end": 22.5, "text": "With CreatorAI, you upload one master recording and get instant 9:16 vertical clips."},
        {"id": 4, "start": 22.5, "end": 31.0, "text": "The AI detects your highest-retention hooks and auto-burns high contrast bold captions."},
        {"id": 5, "start": 31.0, "end": 40.0, "text": "Start automating your creator workflow today and scale your brand effortlessly."}
    ]
    full_text = " ".join([s["text"] for s in segments])
    
    cursor.execute(
        """
        INSERT INTO transcripts (id, asset_id, full_text, segments_json, source, duration)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ("trans_demo_01", asset_id, full_text, json.dumps(segments), "gemini", 40.0)
    )
    
    # 5. Create Highlights
    highlights = [
        {
            "id": "hl_demo_01",
            "start_time": 0.0,
            "end_time": 14.0,
            "hook": "Stop wasting 15 hours editing manually",
            "title": "The Biggest Creator Time Trap",
            "summary": "Explains why manual multi-platform editing destroys creator productivity.",
            "reason": "Immediate attention-grabbing hook with high relatable pain point.",
            "platforms": ["instagram", "youtube", "linkedin"],
            "score": 94
        },
        {
            "id": "hl_demo_02",
            "start_time": 14.0,
            "end_time": 31.0,
            "hook": "Automated 9:16 Short-Form Pipeline",
            "title": "Instant 9:16 Vertical Transformation",
            "summary": "Demonstration of automated aspect ratio conversion and caption styling.",
            "reason": "Clear educational breakdown of automated video workflow.",
            "platforms": ["youtube", "tiktok", "instagram"],
            "score": 91
        },
        {
            "id": "hl_demo_03",
            "start_time": 22.5,
            "end_time": 40.0,
            "hook": "Scale Your Audience Without Burnout",
            "title": "Long-Term Creator Leverage",
            "summary": "Actionable closing framework for scaling audience reach.",
            "reason": "Strong inspirational conclusion with call to action.",
            "platforms": ["linkedin", "instagram"],
            "score": 87
        }
    ]
    
    for hl in highlights:
        cursor.execute(
            """
            INSERT INTO highlights (id, asset_id, start_time, end_time, hook, title, summary, reason, platforms_json, virality_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                hl["id"],
                asset_id,
                hl["start_time"],
                hl["end_time"],
                hl["hook"],
                hl["title"],
                hl["summary"],
                hl["reason"],
                json.dumps(hl["platforms"]),
                hl["score"]
            )
        )
        
    # 6. Render One Demo Short-Form Clip
    demo_clip_path = os.path.join(CLIPS_DIR, "demo_clip_highlight1.mp4")
    demo_clip_thumb = os.path.join(CLIPS_DIR, "demo_clip_highlight1_thumb.jpg")
    
    if os.path.exists(sample_video_path) and not os.path.exists(demo_clip_path):
        try:
            spec = {
                "source_path": sample_video_path,
                "output_path": demo_clip_path,
                "thumbnail_path": demo_clip_thumb,
                "start_time": 0.0,
                "end_time": 14.0,
                "aspect_ratio": "9:16",
                "captions_enabled": True,
                "caption_style": "bold_yellow",
                "segments": segments
            }
            render_clip_from_spec(spec)
        except Exception as e:
            logger.warning(f"Could not render demo starter clip: {e}")
            
    cursor.execute(
        """
        INSERT INTO clips (id, project_id, asset_id, highlight_id, title, output_path, thumbnail_path, duration, aspect_ratio, captions_enabled, caption_style, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "clip_demo_01",
            "proj_demo_01",
            asset_id,
            "hl_demo_01",
            "The Biggest Creator Time Trap",
            demo_clip_path,
            demo_clip_thumb,
            14.0,
            "9:16",
            1,
            "bold_yellow",
            "ready"
        )
    )
    
    # 7. Activity Logs
    cursor.execute(
        """
        INSERT INTO activity_logs (id, project_id, action_type, description)
        VALUES 
            ('act_01', 'proj_demo_01', 'project_created', 'Project AI Content Repurposing Mastery created'),
            ('act_02', 'proj_demo_01', 'video_uploaded', 'Uploaded master video creator_master_demo.mp4'),
            ('act_03', 'proj_demo_01', 'ai_analysis', 'Gemini AI generated timestamped transcript & 3 viral highlights'),
            ('act_04', 'proj_demo_01', 'clip_rendered', 'Generated 9:16 vertical short-form clip with bold subtitles')
        """
    )
    
    conn.commit()
    conn.close()
    logger.info("Demo database seeding complete!")
