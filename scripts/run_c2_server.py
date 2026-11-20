"""
AegisDrone-GEOINT: Tactical Command & Control Server Launcher
Boots the FastAPI backend & WebSocket tactical hub on http://localhost:8000
"""

import sys
import uvicorn
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))


def main():
    print("=" * 75)
    print("  BOOTING AEGISDRONE TACTICAL COMMAND & CONTROL (C2) CONSOLE")
    print("  CipherCop 2026 | Team Gradient Ascent")
    print("  Tactical Web Dashboard: http://localhost:8000")
    print("  WebSocket Telemetry:    ws://localhost:8000/ws/tactical")
    print("=" * 75)
    uvicorn.run("src.server.app:app", host="0.0.0.0", port=8000, reload=False, log_level="info")


if __name__ == "__main__":
    main()
