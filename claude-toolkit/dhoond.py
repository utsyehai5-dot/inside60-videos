#!/usr/bin/env python3
"""YouTube DHOONDO: search karke views, channel, lambai, tareekh ke saath top videos dikhata hai.
Niche/idea research ke liye (kaun si video chal rahi hai).

  python3 claude-toolkit/dhoond.py "how jet engine works" [--n 15] [--shorts] [--naya]

--naya  : nayi videos pehle (upload date se)
--shorts: sirf 60 second se chhoti videos
--info URL : ek video ki poori detail (views, likes, tags, description)
"""
import argparse, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import ytdlp_base, video_info

def fmt_n(n):
    if n is None: return "?"
    for u, d in (("B", 1e9), ("M", 1e6), ("K", 1e3)):
        if n >= d: return f"{n / d:.1f}{u}"
    return str(n)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("query", nargs="?")
    p.add_argument("--n", type=int, default=15)
    p.add_argument("--shorts", action="store_true")
    p.add_argument("--naya", action="store_true")
    p.add_argument("--info", default=None)
    a = p.parse_args()

    if a.info:
        d = video_info(a.info)
        keys = ["title", "channel", "channel_follower_count", "view_count", "like_count",
                "comment_count", "duration", "upload_date", "tags", "description"]
        print(json.dumps({k: d.get(k) for k in keys}, ensure_ascii=False, indent=2))
        return
    if not a.query:
        sys.exit("Query likhein")
    prefix = "ytsearchdate" if a.naya else "ytsearch"
    n = a.n * 3 if a.shorts else a.n
    r = subprocess.run(ytdlp_base() + ["--flat-playlist", "-J", f"{prefix}{n}:{a.query}"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr[-500:])
    rows = []
    for e in json.loads(r.stdout).get("entries", []):
        dur = e.get("duration")
        if a.shorts and (dur is None or dur > 60):
            continue
        rows.append(e)
    for i, e in enumerate(rows[:a.n], 1):
        dur = e.get("duration") or 0
        print(f"{i:2}. {e.get('title')}\n    {fmt_n(e.get('view_count'))} views | {int(dur // 60)}:{int(dur % 60):02d} | "
              f"{e.get('channel') or e.get('uploader')} | {e.get('url')}")

if __name__ == "__main__":
    main()
