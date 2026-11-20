# Claude Toolkit

Free tools jo Claude ko video sunne, dekhne aur YouTube research karne dete hain.
Koi paid API nahi: sirf yt-dlp, Whisper (offline) aur ffmpeg.

## Setup (har naye session mein ek baar)

```bash
bash claude-toolkit/setup.sh
```

## Tools

| Tool | Kaam | Misaal |
|---|---|---|
| `dhoond.py` | YouTube search: views, lambai, channel | `python3 claude-toolkit/dhoond.py "how jet engine works" --n 15` |
| `dhoond.py --shorts` | Sirf Shorts (60s se kam) | `python3 claude-toolkit/dhoond.py "3d how it works" --shorts` |
| `dhoond.py --naya` | Nayi videos pehle | `python3 claude-toolkit/dhoond.py "bacteria 3d" --naya` |
| `sun.py` | Video/audio ko text mein badalna (Whisper) | `python3 claude-toolkit/sun.py video.mp4 --model small` |
| `dekh.py` | Video se frames + grid tasveer (time ke saath) | `python3 claude-toolkit/dekh.py video.mp4 --har 5` |

Output `kaam/` folder mein jata hai (GitHub par nahi jata).

## Zaroori baat: YouTube download

YouTube cloud servers se **download** rok deta hai ("Sign in to confirm you're not a bot").
- **Search (`dhoond.py`) chalta hai.**
- **Video sunna/dekhna:** video file chat mein upload karein, ya kisi doosri site ka direct link dein.
- Optional: `cookies.txt` file `claude-toolkit/` mein rakhein. Ye sirf usi session mein rakhein, GitHub par **kabhi nahi** (.gitignore mein hai). Iske liye ek alag/second Google account behtar hai.
