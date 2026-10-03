import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ..database import get_db_connection
from ..schemas import JobResponse

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
logger = logging.getLogger("backend.routes.jobs")

@router.get("", response_model=List[JobResponse])
def get_jobs(status: Optional[str] = None):
    conn = get_db_connection()
    if status:
        rows = conn.execute("SELECT * FROM processing_jobs WHERE status = ? ORDER BY created_at DESC LIMIT 20", (status,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM processing_jobs ORDER BY created_at DESC LIMIT 20").fetchall()
    conn.close()
    
    results = []
    for r in rows:
        res = json.loads(r["result_json"]) if r["result_json"] else None
        results.append(JobResponse(
            id=r["id"],
            job_type=r["job_type"],
            asset_id=r["asset_id"],
            clip_id=r["clip_id"],
            status=r["status"],
            progress=r["progress"] or 0,
            error=r["error"],
            result=res,
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        ))
    return results

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM processing_jobs WHERE id = ?", (job_id,)).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
        
    res = json.loads(row["result_json"]) if row["result_json"] else None
    return JobResponse(
        id=row["id"],
        job_type=row["job_type"],
        asset_id=row["asset_id"],
        clip_id=row["clip_id"],
        status=row["status"],
        progress=row["progress"] or 0,
        error=row["error"],
        result=res,
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )
