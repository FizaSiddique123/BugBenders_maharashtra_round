import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from root
root_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(root_dir / ".env")

BASE_DIR = root_dir
STORAGE_DIR = root_dir / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
CLIPS_DIR = STORAGE_DIR / "clips"
TEMP_DIR = STORAGE_DIR / "temp"
SAMPLES_DIR = STORAGE_DIR / "samples"
DB_PATH = STORAGE_DIR / "creatorai.db"

# Ensure all directories exist
for folder in [STORAGE_DIR, UPLOADS_DIR, CLIPS_DIR, TEMP_DIR, SAMPLES_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "500"))
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".jpg", ".jpeg", ".png"}
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
