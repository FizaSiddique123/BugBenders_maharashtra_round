import json
import logging
from fastapi import APIRouter, HTTPException
from ..database import get_db_connection
from ..schemas import TranscriptResponse, TranscriptSegment
from ..services.job_manager import start_transcription_job

router = APIRouter(prefix="/api/transcription", tags=["Transcription"])
logger = logging.getLogger("backend.routes.transcription")

@router.get("/{asset_id}", response_model=TranscriptResponse)
def get_transcription(asset_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM transcripts WHERE asset_id = ?", (asset_id,)).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Transcript not found for this asset. Transcription may still be processing.")
        
    segments_raw = json.loads(row["segments_json"]) if row["segments_json"] else []
    segments = [
        TranscriptSegment(
            id=s.get("id", i+1),
            start=float(s.get("start", 0.0)),
            end=float(s.get("end", 0.0)),
            text=str(s.get("text", ""))
        )
        for i, s in enumerate(segments_raw)
    ]
    
    return TranscriptResponse(
        id=row["id"],
        asset_id=row["asset_id"],
        full_text=row["full_text"] or "",
        segments=segments,
        duration=row["duration"] or 0.0,
        source=row["source"] or "gemini",
        created_at=row["created_at"]
    )

@router.post("/{asset_id}")
def trigger_transcription(asset_id: str):
    conn = get_db_connection()
    asset = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    conn.close()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    job_id = start_transcription_job(asset_id)
    return {"message": "Transcription job queued successfully", "job_id": job_id, "asset_id": asset_id}
