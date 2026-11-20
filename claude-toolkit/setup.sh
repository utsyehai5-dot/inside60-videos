#!/usr/bin/env bash
# Claude toolkit setup: har naye session mein ek baar chalayein.
#   bash claude-toolkit/setup.sh
set -e
pip install -q --break-system-packages -U yt-dlp faster-whisper pillow 2>&1 | grep -v -i warning || true
command -v ffmpeg >/dev/null || { echo "ffmpeg missing - installing"; (apt-get install -y -q ffmpeg || pip install -q --break-system-packages imageio-ffmpeg); }
command -v node >/dev/null && echo "node: ok (YouTube JS runtime)" || echo "WARNING: node nahi mila, kuch YouTube formats miss ho sakte hain"
echo "Toolkit ready: sun.py (video suno), dekh.py (video dekho), dhoond.py (YouTube search)"
