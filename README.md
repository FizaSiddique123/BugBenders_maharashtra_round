# ⚡ CreatorAI — AI-Powered Creator Operating System

> **BitNBuild Hackathon MVP | 24-Hour Implementation**
> An end-to-end AI operating system that transforms long-form master media into viral 9:16 vertical short-form clips, generates structured scripts with high-retention hooks, analyzes delivery against transcripts, enables editable video fine-tuning, and tailors multi-platform distribution across Instagram Reels, YouTube Shorts, and LinkedIn.

---

## 🚀 Key Highlights & 8 Core Modules

1. **Module A — Creator Dashboard (`/`)**: Overview metrics, recent media assets, latest short-form clips, live async processing jobs, and quick action launchpad.
2. **Module B — Centralized Media Library (`/media`)**: Raw asset management, drag-and-drop video upload, duration/size probing, thumbnail preview modal, and 1-click instant demo master generator.
3. **Module C — AI Script & Hook Generator (`/scripts`)**: Structured script generator powered by Gemini AI with 3 alternative hooks (Curiosity, Contrarian, Direct Value), duration timeline breakdown, caption, hashtags, and project persistence.
4. **Module D — Script-to-Video Understanding (`/studio`)**: Timestamped speech-to-text transcription, synchronized video seeker, and script-vs-spoken delivery adherence comparator (matching talking points, skipped sections, ad-lib notes).
5. **Module E — AI Highlight Detection (`/studio`)**: Pinpoints 3–5 high-retention short-form clip opportunities with validated timestamps, virality scores, rationale, and platform tags.
6. **Module F — Automated Short-Form Clip Generation (`/studio` & `video_engine`)**: Real FFmpeg pipeline cutting exact segments, converting to 9:16 vertical format with professional blurred canvas backgrounds, and burning high-contrast styled subtitles.
7. **Module G — Editable AI Video Editor (`/editor`)**: User-editable JSON edit specification allowing start/end time trimming, aspect ratio swapping (9:16, 16:9, 1:1), subtitle toggling, and typography styles (Bold Yellow, Neon Cyan, Clean White) with instant re-rendering.
8. **Module H — Multi-Platform Adaptation (`/scripts`)**: Tailored content packages formatted specifically for Instagram Reels (punchy captions & hashtags), YouTube Shorts (high CTR titles & descriptions), and LinkedIn (professional thought leadership posts).
9. **Module I — Content Workflow (`/calendar`)**: Interactive 6-stage Kanban board (`Idea` → `Script` → `Video Uploaded` → `AI Analysis` → `Clip Generated` → `Ready to Publish` → `Published`).
10. **Module J — Creator Intelligence & Performance Insights (`/analytics`)**: Live SQLite production metrics, weekly velocity chart, AI content optimization recommendations, and clearly labelled **SAMPLE BENCHMARK DATA** for estimated social reach.

---

## 👥 4-Member Modular Architecture

```
BugBenders_maharashtra_round/
├── frontend/             # Member 1 — UI/UX & Frontend Lead
│   ├── src/app/          # 8 Next.js App Router Pages
│   ├── src/components/   # AppShell, Video Players, Modals, Kanban
│   └── src/lib/          # API Client & TypeScript Schema Contracts
├── backend/              # Member 2 — Backend & Integration Lead
│   ├── app/routes/       # REST API Endpoints (Assets, Clips, Projects, Scripts, Jobs)
│   ├── app/database.py   # SQLite Schema & Connection Pool
│   └── app/services/     # Background Job Manager & Sample Data Seeder
├── ai_engine/            # Member 3 — AI & Prompt Engineering Lead
│   ├── gemini_client.py  # Gemini 1.5 Pro / Flash Integration & JSON Parsers
│   ├── transcription.py  # Audio Extraction & Multimodal/Whisper Transcription
│   ├── highlight_det.py  # 3-5 Highlight Opportunity Detector with Timestamp Validation
│   ├── script_gen.py     # 3 Hook Script Writer & Delivery Comparator
│   └── platform_adapt.py # Instagram, YouTube Shorts, LinkedIn Adapters
└── video_engine/         # Member 4 — Video Processing & DevOps Lead
    ├── ffmpeg_utils.py   # FFmpeg / FFprobe Prober, Thumbnailer & Sample Video Creator
    ├── clip_extractor.py # Sub-segment Cutting with Re-encoding / Stream Copy
    ├── aspect_ratio.py   # 9:16 Vertical Blur-Canvas & Crop Converter
    ├── subtitle_gen.py   # SRT / ASS Subtitle Generator & Burner
    └── video_renderer.py # EditSpec Video Pipeline Renderer
```

---

## 🛠️ Quick Start (Run Locally in 60 Seconds)

### Prerequisites
- **Node.js**: v18+ (Node v24.x recommended)
- **Python**: 3.10+ (Python 3.12 verified)
- **FFmpeg**: Automatically provided via `imageio-ffmpeg` (zero manual PATH configuration required!)

### 1. Install Backend Dependencies
```bash
python -m pip install -r backend/requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment (Optional)
Copy `.env.example` to `.env` and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
HOST=127.0.0.1
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```
*(Note: CreatorAI features built-in fallback intelligence engines so all dashboards, video renderers, transcripts, and highlight generators work offline even without an API key!)*

### 4. Launch Full Stack
Run the unified launcher:
```bash
python run_all.py
```
Or start each service separately:
- **Backend**: `python backend/run.py` (Runs on `http://127.0.0.1:8000`, API Docs at `http://127.0.0.1:8000/docs`)
- **Frontend**: `cd frontend && npm run dev` (Runs on `http://localhost:3000`)

---

## 🎬 2-Minute Hackathon Demonstration Script

1. **Dashboard Overview (`/`)**: Show the live system status, recent master videos, generated 9:16 vertical shorts, and time saved metrics.
2. **Instant Demo Asset**: Click **"Generate Demo Video"** to showcase zero-upload synthetic test pattern video creation.
3. **AI Video Studio (`/studio`)**:
   - Inspect the timestamped transcript. Click any line to jump the video player to that timestamp.
   - Review the 3 AI-detected highlights with virality scores, hooks, and platform tags.
   - Select Highlight #1, choose **"9:16 Vertical"** and **"Bold Yellow"** captions, then click **"Generate MP4 Clip"**.
4. **Editable AI Video Editor (`/editor`)**:
   - Preview the rendered 9:16 short-form video playing with high-contrast burned-in subtitles.
   - Adjust the time boundary by 2 seconds, switch to **"Neon Cyan"**, and click **"Render Final Video"**.
   - Download the finalized MP4.
5. **AI Script & Hook Generator (`/scripts`)**:
   - Type a topic (e.g. *"AI Tools for Content Creators"*), click **"Generate with Gemini AI"**.
   - Review 3 distinct hook variations, timeline script sections, and switch between Instagram, YouTube Shorts, and LinkedIn copy packages.
6. **Content Workflow Kanban (`/calendar`)**: Drag or update project stages across the 6-step lifecycle.
7. **Creator Intelligence (`/analytics`)**: Show production KPIs alongside clearly labelled sample benchmark social data and AI strategy recommendations.
