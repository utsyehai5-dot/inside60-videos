#!/usr/bin/env python3
"""Video SUNO: YouTube link ya local file ki awaaz ko text (transcript) mein badalta hai. Bilkul free (Whisper, offline).

  python3 claude-toolkit/sun.py URL_YA_FILE [--model small] [--lang ur] [--out kaam/]

Models: tiny (sabse tez), base, small (default, achha balance), medium (behtar, slow).
Output: <out>/<naam>.txt  (timestamps ke saath) aur <naam>.srt (subtitles)
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import is_url, download

def ts(s, srt=False):
    h, m = int(s // 3600), int(s % 3600 // 60)
    sec = s % 60
    return f"{h:02d}:{m:02d}:{sec:06.3f}".replace(".", ",") if srt else f"{h:02d}:{m:02d}:{int(sec):02d}"

def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("--model", default="small")
    p.add_argument("--lang", default=None, help="jaise en, ur, hi, sv. Khali chhorein to khud pehchanega")
    p.add_argument("--out", default="kaam")
    a = p.parse_args()

    src = download(a.src, a.out, audio_only=True) if is_url(a.src) else a.src
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    # ffmpeg se 16kHz mono audio nikalo (PyAV version jhagron se bachne ke liye)
    import subprocess, numpy as np
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-f", "s16le", "-ac", "1",
                          "-ar", "16000", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    segs, info = model.transcribe(audio, language=a.lang, vad_filter=True)
    base = os.path.join(a.out, os.path.splitext(os.path.basename(src))[0])
    os.makedirs(a.out, exist_ok=True)
    with open(base + ".txt", "w") as t, open(base + ".srt", "w") as s:
        t.write(f"# language: {info.language}  duration: {ts(info.duration)}\n")
        for i, sg in enumerate(segs, 1):
            line = sg.text.strip()
            t.write(f"[{ts(sg.start)}] {line}\n")
            s.write(f"{i}\n{ts(sg.start, True)} --> {ts(sg.end, True)}\n{line}\n\n")
            print(f"[{ts(sg.start)}] {line}", flush=True)
    print(f"\nSaved: {base}.txt  {base}.srt")

if __name__ == "__main__":
    main()
