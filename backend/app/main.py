import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.config import STORAGE_DIR, HOST, PORT
from backend.app.database import init_db

from ai_engine.gemini_client import is_gemini_configured, get_api_key

# Import Routers
from backend.app.routes.assets import router as assets_router
from backend.app.routes.transcription import router as transcription_router
from backend.app.routes.highlights import router as highlights_router
from backend.app.routes.clips import router as clips_router
from backend.app.routes.projects import router as projects_router
from backend.app.routes.scripts import router as scripts_router
from backend.app.routes.platform import router as platform_router
from backend.app.routes.hooks import router as hooks_router
from backend.app.routes.analytics import router as analytics_router
from backend.app.routes.jobs import router as jobs_router
from backend.app.routes.content import router as content_router

# Initialize DB immediately on module import
init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[CreatorAI] Initializing database...")
    init_db()

    print(f"[CreatorAI] Backend initialized. Gemini configured: {is_gemini_configured()}")
    yield
    # Shutdown
    print("[CreatorAI] Backend shutting down.")


app = FastAPI(
    title="CreatorAI Backend API",
    description="AI-Powered Creator Operating System API | BitNBuild Hackathon MVP",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount /storage directory for direct video and thumbnail streaming
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Include Routers
app.include_router(assets_router)
app.include_router(transcription_router)
app.include_router(highlights_router)
app.include_router(clips_router)
app.include_router(projects_router)
app.include_router(scripts_router)
app.include_router(platform_router)
app.include_router(hooks_router)
app.include_router(analytics_router)
app.include_router(jobs_router)
app.include_router(content_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "gemini_configured": is_gemini_configured(),
        "storage_path": str(STORAGE_DIR)
    }

class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None

@app.get("/api/settings")
def get_settings():
    key = get_api_key()
    masked = f"{key[:4]}...{key[-4:]}" if key and len(key) > 8 else ("Configured" if key else "Not Configured")
    return {
        "gemini_api_key_status": masked,
        "is_configured": is_gemini_configured(),
        "storage_dir": str(STORAGE_DIR),
        "ffmpeg_available": True
    }

@app.post("/api/settings")
def update_settings(req: SettingsUpdate):
    if req.gemini_api_key is not None:
        os.environ["GEMINI_API_KEY"] = req.gemini_api_key
        # Also persist to .env
        try:
            env_path = root_dir / ".env"
            with open(env_path, "w") as f:
                f.write(f"GEMINI_API_KEY={req.gemini_api_key}\n")
        except Exception as e:
            print(f"Failed to write .env: {e}")
            
    return {
        "message": "Settings updated successfully",
        "is_configured": is_gemini_configured()
    }
