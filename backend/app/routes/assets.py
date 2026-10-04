import os
import uuid
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from ..database import get_db_connection
from ..config import UPLOADS_DIR, SAMPLES_DIR, ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE_MB
from ..schemas import AssetResponse
from ..services.job_manager import log_activity, start_transcription_job
from video_engine.ffmpeg_utils import probe_video, generate_thumbnail, create_sample_video
from ..auth import get_current_user

router = APIRouter(prefix="/api/assets", tags=["Assets"])
logger = logging.getLogger("backend.routes.assets")

@router.get("", response_model=List[AssetResponse])
def get_assets(project_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    if project_id:
        rows = conn.execute("SELECT * FROM assets WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC", (project_id, user_id)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
    conn.close()
    
    result = []
    for r in rows:
        meta = json.loads(r["metadata_json"]) if r["metadata_json"] else {}
        result.append(AssetResponse(
            id=r["id"],
            project_id=r["project_id"],
            filename=r["filename"],
            filepath=r["filepath"],
            file_type=r["file_type"],
            duration=r["duration"] or 0.0,
            size_bytes=r["size_bytes"] or 0,
            status=r["status"],
            thumbnail_path=r["thumbnail_path"],
            created_at=r["created_at"],
            metadata=meta
        ))
    return result

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM assets WHERE id = ? AND user_id = ?", (asset_id, user_id)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    meta = json.loads(row["metadata_json"]) if row["metadata_json"] else {}
    return AssetResponse(
        id=row["id"],
        project_id=row["project_id"],
        filename=row["filename"],
        filepath=row["filepath"],
        file_type=row["file_type"],
        duration=row["duration"] or 0.0,
        size_bytes=row["size_bytes"] or 0,
        status=row["status"],
        thumbnail_path=row["thumbnail_path"],
        created_at=row["created_at"],
        metadata=meta
    )

@router.post("/upload", response_model=AssetResponse)
async def upload_asset(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    auto_transcribe: bool = Form(True),
    user_id: str = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Allowed: {ALLOWED_EXTENSIONS}")
        
    asset_id = f"asset_{uuid.uuid4().hex[:8]}"
    clean_filename = f"{asset_id}_{file.filename.replace(' ', '_')}"
    save_path = os.path.join(UPLOADS_DIR, clean_filename)
    
    # Stream file to disk to preserve memory
    size = 0
    with open(save_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            size += len(chunk)
            if size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                os.remove(save_path)
                raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB")
            f.write(chunk)
            
    is_video = ext in {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    duration = 0.0
    thumb_path = None
    meta = {}
    
    if is_video:
        try:
            meta = probe_video(save_path)
            duration = meta.get("duration", 0.0)
            thumb_filename = f"{asset_id}_thumb.jpg"
            thumb_path = os.path.join(UPLOADS_DIR, thumb_filename)
            generate_thumbnail(save_path, thumb_path, timestamp_sec=min(1.0, duration * 0.1))
        except Exception as e:
            logger.warning(f"Video probing/thumbnailing error: {e}")
            
    conn = get_db_connection()
    if not project_id:
        project_id = f"proj_{uuid.uuid4().hex[:8]}"
        conn.execute(
            """
            INSERT INTO projects (id, user_id, title, status, stage, description)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (project_id, user_id, file.filename, "Video Uploaded", "Video Uploaded", "Automatically generated from video upload")
        )
        conn.execute(
            "INSERT INTO activity_logs (id, user_id, project_id, action_type, description) VALUES (?, ?, ?, ?, ?)",
            (f"act_{uuid.uuid4().hex[:8]}", user_id, project_id, "created", "Project auto-created from video upload")
        )

    conn.execute(
        """
        INSERT INTO assets (id, user_id, project_id, filename, filepath, file_type, duration, size_bytes, status, thumbnail_path, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            asset_id,
            user_id,
            project_id,
            file.filename,
            save_path,
            file.content_type or ("video/mp4" if is_video else "image/jpeg"),
            duration,
            size,
            "ready",
            thumb_path,
            json.dumps(meta)
        )
    )
    conn.commit()
    conn.close()
    
    log_activity("asset_upload", f"Uploaded media asset '{file.filename}' ({round(size / (1024*1024), 2)}MB)", project_id=project_id)
    
    # Auto-trigger transcription and highlight detection in background
    if is_video and auto_transcribe:
        start_transcription_job(asset_id, user_id)
        
    return AssetResponse(
        id=asset_id,
        project_id=project_id,
        filename=file.filename,
        filepath=save_path,
        file_type=file.content_type or ("video/mp4" if is_video else "image/jpeg"),
        duration=duration,
        size_bytes=size,
        status="ready",
        thumbnail_path=thumb_path,
        created_at="Just now",
        metadata=meta
    )
@router.delete("/{asset_id}")
def delete_asset(asset_id: str, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM assets WHERE id = ? AND user_id = ?", (asset_id, user_id)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Asset not found")
        
    filepath = row["filepath"]
    thumb_path = row["thumbnail_path"]
    
    conn.execute("DELETE FROM assets WHERE id = ?", (asset_id,))
    conn.commit()
    conn.close()
    
    # Clean files
    for p in [filepath, thumb_path]:
        if p and os.path.exists(p) and "demo_master" not in p:
            try:
                os.remove(p)
            except Exception:
                pass
                
    return {"message": "Asset deleted successfully", "id": asset_id}
