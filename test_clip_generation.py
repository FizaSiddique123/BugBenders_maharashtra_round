import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app.database import get_db_connection
from video_engine.video_renderer import render_clip_from_spec

conn = get_db_connection()
asset = conn.execute("SELECT * FROM assets LIMIT 1").fetchone()
conn.close()

if not asset:
    print("No asset found!")
    sys.exit(1)

spec = {
    "source_path": asset["filepath"],
    "output_path": "storage/clips/test_clip.mp4",
    "start_time": 0.0,
    "end_time": 5.0,
    "aspect_ratio": "9:16",
    "captions_enabled": False
}

try:
    result = render_clip_from_spec(spec)
    print("SUCCESS:", result)
except Exception as e:
    print("FAILED:", e)
