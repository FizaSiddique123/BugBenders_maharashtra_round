import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    print("Testing End-to-End Workflow")
    
    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    print("Health:", res.json())
    
    # 2. Upload asset
    res = requests.post(f"{BASE_URL}/api/assets/sample")
    if not res.ok:
        print("Sample Asset Failed:", res.text)
        return
    asset = res.json()
    print("Sample Asset Created:", asset["id"])
    asset_id = asset["id"]
    
    # 3. Transcription
    print("Polling for transcription...")
    transcription_ready = False
    for i in range(15):
        res = requests.get(f"{BASE_URL}/api/transcription/{asset_id}")
        if res.status_code == 200:
            t_data = res.json()
            if len(t_data.get("segments", [])) > 0:
                print("Transcription Ready!")
                transcription_ready = True
                break
        time.sleep(2)
        
    if not transcription_ready:
        print("Transcription failed or timed out.")
        return
        
    # 4. Generate highlights
    res = requests.post(f"{BASE_URL}/api/highlights/{asset_id}")
    print("Highlights Generated:", res.status_code)
    highlights = res.json().get("highlights", [])
    print("Found", len(highlights), "highlights")
    
    # 5. Generate Clip
    if highlights:
        hl = highlights[0]
        payload = {
            "asset_id": asset_id,
            "start_time": hl.get("start_time", 0.0),
            "end_time": hl.get("end_time", 10.0),
            "title": hl.get("title", "Test Clip")
        }
        res = requests.post(f"{BASE_URL}/api/clips/generate", json=payload)
        print("Generate Clip Response:", res.json())
    else:
        print("No highlights to generate clip from.")
    
    # 6. Generate Script
    payload = {
        "topic": "Artificial Intelligence in 2026",
        "platform": "youtube_shorts"
    }
    res = requests.post(f"{BASE_URL}/api/scripts/generate", json=payload)
    print("Generate Script Response:", res.status_code)

if __name__ == "__main__":
    run_test()
