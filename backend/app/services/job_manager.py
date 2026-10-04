import threading
import uuid
import json
import logging
import sqlite3
from typing import Dict, Any, Optional
from ..database import get_db_connection
from ai_engine.transcription_service import transcribe_video
from ai_engine.highlight_detector import detect_highlights
from video_engine.video_renderer import render_clip_from_spec
from video_engine.ffmpeg_utils import probe_video, generate_thumbnail, create_sample_video

logger = logging.getLogger("backend.job_manager")

def create_job(job_type: str, user_id: str, asset_id: Optional[str] = None, clip_id: Optional[str] = None) -> str:
    job_id = f"job_{uuid.uuid4().hex[:10]}"
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO processing_jobs (id, user_id, job_type, asset_id, clip_id, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (job_id, user_id, job_type, asset_id, clip_id, "pending", 0)
    )
    conn.commit()
    conn.close()
    return job_id

def update_job(job_id: str, status: str, progress: int, error: Optional[str] = None, result: Optional[Dict[str, Any]] = None):
    conn = get_db_connection()
    result_str = json.dumps(result) if result else None
    conn.execute(
        "UPDATE processing_jobs SET status = ?, progress = ?, error = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (status, progress, error, result_str, job_id)
    )
    conn.commit()
    conn.close()

def log_activity(action_type: str, description: str, project_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, user_id: str = "anonymous"):
    conn = get_db_connection()
    log_id = f"act_{uuid.uuid4().hex[:8]}"
    conn.execute(
        "INSERT INTO activity_logs (id, user_id, project_id, action_type, description, metadata_json) VALUES (?, ?, ?, ?, ?, ?)",
        (log_id, user_id, project_id, action_type, description, json.dumps(metadata or {}))
    )
    conn.commit()
    conn.close()

def _transcribe_worker(job_id: str, asset_id: str, user_id: str):
    try:
        update_job(job_id, "processing", 10)
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
        conn.close()
        
        if not row:
            update_job(job_id, "failed", 0, error="Asset not found")
            return
            
        filepath = row["filepath"]
        update_job(job_id, "processing", 30)
        
        transcript_data = transcribe_video(filepath)
        update_job(job_id, "processing", 70)
        
        # Save transcript to DB
        t_id = f"trans_{uuid.uuid4().hex[:8]}"
        conn = get_db_connection()
        conn.execute(
            """
            INSERT INTO transcripts (id, asset_id, full_text, segments_json, source, duration)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(asset_id) DO UPDATE SET
                full_text = excluded.full_text,
                segments_json = excluded.segments_json,
                source = excluded.source,
                duration = excluded.duration
            """,
            (
                t_id,
                asset_id,
                transcript_data.get("full_text", ""),
                json.dumps(transcript_data.get("segments", [])),
                transcript_data.get("source", "gemini"),
                transcript_data.get("duration", 0.0)
            )
        )
        conn.commit()
        conn.close()
        
        # Auto-trigger highlight detection
        update_job(job_id, "processing", 85)
        hls_data = detect_highlights(transcript_data, transcript_data.get("duration", 60.0))
        
        conn = get_db_connection()
        # Clean old highlights for this asset
        conn.execute("DELETE FROM highlights WHERE asset_id = ?", (asset_id,))
        for hl in hls_data.get("highlights", []):
            hl_id = f"hl_{uuid.uuid4().hex[:8]}"
            conn.execute(
                """
                INSERT INTO highlights (id, asset_id, start_time, end_time, hook, title, summary, reason, platforms_json, virality_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    hl_id,
                    asset_id,
                    hl["start_time"],
                    hl["end_time"],
                    hl["hook"],
                    hl["title"],
                    hl["summary"],
                    hl["reason"],
                    json.dumps(hl.get("platforms", ["instagram", "youtube", "linkedin"])),
                    hl.get("virality_score", 88)
                )
            )
        conn.commit()
        conn.close()
        
        log_activity("transcription", f"Transcribed video '{row['filename']}' and detected {len(hls_data.get('highlights', []))} highlights", project_id=row["project_id"], user_id=user_id)
        
        # Move project to AI Analysis stage if it has a project_id
        if row["project_id"]:
            conn = get_db_connection()
            conn.execute(
                "UPDATE projects SET status = 'AI Analysis', stage = 'AI Analysis', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (row["project_id"],)
            )
            conn.commit()
            conn.close()

        update_job(job_id, "completed", 100, result={"transcription": transcript_data, "highlights": hls_data})
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        update_job(job_id, "failed", 0, error=str(e))

def start_transcription_job(asset_id: str, user_id: str = "anonymous") -> str:
    job_id = create_job("transcription", user_id=user_id, asset_id=asset_id)
    thread = threading.Thread(target=_transcribe_worker, args=(job_id, asset_id, user_id), daemon=True)
    thread.start()
    return job_id
    
def _render_clip_worker(job_id: str, clip_id: str, spec: Dict[str, Any], user_id: str):
    try:
        update_job(job_id, "processing", 15)
        conn = get_db_connection()
        clip_row = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
        conn.close()
        
        if not clip_row:
            update_job(job_id, "failed", 0, error="Clip not found")
            return
            
        update_job(job_id, "processing", 40)
        metadata = render_clip_from_spec(spec)
        update_job(job_id, "processing", 90)
        
        conn = get_db_connection()
        conn.execute(
            """
            UPDATE clips SET
                output_path = ?,
                thumbnail_path = ?,
                duration = ?,
                aspect_ratio = ?,
                captions_enabled = ?,
                caption_style = ?,
                edit_spec_json = ?,
                status = 'ready'
            WHERE id = ?
            """,
            (
                metadata["output_path"],
                metadata["thumbnail_path"],
                metadata["duration"],
                spec.get("aspect_ratio", "9:16"),
                1 if spec.get("captions_enabled", True) else 0,
                spec.get("caption_style", "bold_yellow"),
                json.dumps(spec),
                clip_id
            )
        )
        conn.commit()
        conn.close()
        
        log_activity("clip_rendered", f"Rendered short-form clip '{clip_row['title']}' ({metadata['duration']}s, {spec.get('aspect_ratio')})", project_id=clip_row["project_id"], user_id=user_id)
        update_job(job_id, "completed", 100, result=metadata)
        
    except Exception as e:
        logger.error(f"Render job {job_id} failed: {e}", exc_info=True)
        update_job(job_id, "failed", 0, error=str(e))
        conn = get_db_connection()
        conn.execute("UPDATE clips SET status = 'failed' WHERE id = ?", (clip_id,))
        conn.commit()
        conn.close()

def start_clip_render_job(clip_id: str, spec: Dict[str, Any], user_id: str = "anonymous") -> str:
    job_id = create_job("clip_render", user_id=user_id, clip_id=clip_id)
    thread = threading.Thread(target=_render_clip_worker, args=(job_id, clip_id, spec, user_id), daemon=True)
    thread.start()
    return job_id
