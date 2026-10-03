import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from video_engine import create_sample_video, render_clip_from_spec


def test_pipeline():
    os.makedirs("storage/samples", exist_ok=True)
    os.makedirs("storage/clips", exist_ok=True)
    print("1. Creating sample video...")
    master = create_sample_video("storage/samples/demo_master.mp4", duration_sec=20)
    print(f"Created master video: {master} ({os.path.getsize(master)} bytes)")
    
    spec = {
        "source_path": master,
        "output_path": "storage/clips/test_clip_916.mp4",
        "start_time": 2.0,
        "end_time": 10.0,
        "aspect_ratio": "9:16",
        "captions_enabled": True,
        "caption_style": "bold_yellow",
        "segments": [
            {"start": 2.5, "end": 6.0, "text": "Stop making this common creator mistake!"},
            {"start": 6.5, "end": 9.5, "text": "AI video workflows will 10x your output."}
        ]
    }
    
    print("2. Rendering clip from spec...")
    res = render_clip_from_spec(spec)
    print("3. Render succeeded! Metadata:", res)
    assert os.path.exists("storage/clips/test_clip_916.mp4")
    assert os.path.exists(res.get("thumbnail_path", ""))
    print("All video engine tests PASSED!")

if __name__ == "__main__":
    test_pipeline()
