"""
CreatorAI - Full System Launcher
Starts both the FastAPI Backend (Port 8000) and Next.js Frontend (Port 3000) concurrently.
"""

import os
import sys
import subprocess
import time
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    print("=" * 60)
    print("  CREATORAI — AI-Powered Creator Operating System")
    print("  BitNBuild Hackathon MVP")
    print("=" * 60)
    print("Starting Backend on http://127.0.0.1:8000 ...")
    print("Starting Frontend on http://localhost:3000 ...")
    print("-" * 60)
    
    # 1. Start Backend
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=root_dir)
    
    # Wait 2 seconds for backend initialization
    time.sleep(2)
    
    # 2. Start Frontend
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir)
    
    print("\n[CreatorAI Ready]")
    print("  Backend API:  http://127.0.0.1:8000")
    print("  Swagger Docs: http://127.0.0.1:8000/docs")
    print("  Frontend UI:  http://localhost:3000")
    print("\nPress Ctrl+C to terminate both servers.\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down CreatorAI services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
