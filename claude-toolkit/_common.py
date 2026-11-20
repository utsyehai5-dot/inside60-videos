import os, shutil, subprocess, sys

def ytdlp_base():
    cmd = ["yt-dlp", "--no-warnings", "--no-playlist"]
    if shutil.which("node"):
        cmd += ["--js-runtimes", "node"]
    # YouTube cloud servers ko "bot" samajh kar rokta hai. Agar cookies.txt file ho to use karo.
    # Ye file KABHI GitHub par na daalein (.gitignore mein hai).
    ck = os.environ.get("YTDLP_COOKIES") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "cookies.txt")
    if os.path.exists(ck):
        cmd += ["--cookies", ck]
    return cmd

def is_url(s):
    return s.startswith("http://") or s.startswith("https://")

def download(url, outdir, audio_only=False):
    """URL se video/audio download karta hai, file path wapas deta hai."""
    os.makedirs(outdir, exist_ok=True)
    tmpl = os.path.join(outdir, "%(id)s.%(ext)s")
    fmt = "bestaudio/best" if audio_only else "bv*[height<=720]+ba/b[height<=720]/best"
    cmd = ytdlp_base() + ["-f", fmt, "-o", tmpl, "--print", "after_move:filepath", url]
    if not audio_only:
        cmd += ["--merge-output-format", "mp4"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("Download fail: " + r.stderr.strip()[-500:])
    return r.stdout.strip().splitlines()[-1]

def video_info(url):
    import json
    r = subprocess.run(ytdlp_base() + ["-J", "--skip-download", url], capture_output=True, text=True)
    if r.returncode != 0:
        return {}
    return json.loads(r.stdout)
