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

from src.config import settings


def main():
    print("=" * 75)
    print("  BOOTING AEGISDRONE TACTICAL COMMAND & CONTROL (C2) CONSOLE")
    print("  CipherCop 2026 | Team Gradient Ascent")
    print(f"  Tactical Web Dashboard: http://{settings.HOST}:{settings.PORT}")
    print(f"  WebSocket Telemetry:    ws://{settings.HOST}:{settings.PORT}/ws/tactical")
    print("=" * 75)
    uvicorn.run("src.server.app:app", host=settings.HOST, port=settings.PORT, reload=False, log_level="info")


if __name__ == "__main__":
    main()
