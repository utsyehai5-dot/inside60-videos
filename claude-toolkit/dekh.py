#!/usr/bin/env python3
"""Video DEKHO: video se har N second baad frame nikalta hai aur unhein ek-do 'contact sheet'
(grid tasveer, har frame par time likha) mein jorta hai, taa ke Claude Read tool se poori video ek nazar mein dekh sake.

  python3 claude-toolkit/dekh.py URL_YA_FILE [--har 5] [--grid 4x4] [--out kaam/] [--shuru 0] [--khatam 60]

Output: <out>/<naam>_frames/*.jpg  aur  <out>/<naam>_sheet_01.jpg, _02.jpg ...
"""
import argparse, glob, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import is_url, download

def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("--har", type=float, default=5, help="har kitne second baad ek frame")
    p.add_argument("--grid", default="4x4")
    p.add_argument("--out", default="kaam")
    p.add_argument("--shuru", type=float, default=0)
    p.add_argument("--khatam", type=float, default=None)
    p.add_argument("--width", type=int, default=480)
    a = p.parse_args()

    src = download(a.src, a.out) if is_url(a.src) else a.src
    name = os.path.splitext(os.path.basename(src))[0]
    fdir = os.path.join(a.out, name + "_frames")
    os.makedirs(fdir, exist_ok=True)
    for f in glob.glob(os.path.join(fdir, "*.jpg")):
        os.remove(f)
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-ss", str(a.shuru)]
    if a.khatam:
        cmd += ["-to", str(a.khatam)]
    cmd += ["-i", src, "-vf", f"fps=1/{a.har},scale={a.width}:-2", "-q:v", "3",
            os.path.join(fdir, "f_%05d.jpg")]
    subprocess.run(cmd, check=True)
    frames = sorted(glob.glob(os.path.join(fdir, "*.jpg")))
    if not frames:
        sys.exit("Koi frame nahi nikla")

    from PIL import Image, ImageDraw
    cols, rows = map(int, a.grid.lower().split("x"))
    per = cols * rows
    w, h = Image.open(frames[0]).size
    sheets = []
    for si in range(0, len(frames), per):
        sheet = Image.new("RGB", (cols * w, rows * h), "black")
        d = ImageDraw.Draw(sheet)
        for j, fp in enumerate(frames[si:si + per]):
            idx = si + j
            t = a.shuru + idx * a.har
            x, y = (j % cols) * w, (j // cols) * h
            sheet.paste(Image.open(fp), (x, y))
            label = f"{int(t // 60):02d}:{int(t % 60):02d}"
            d.rectangle([x, y, x + 62, y + 20], fill="black")
            d.text((x + 5, y + 4), label, fill="yellow")
        out = os.path.join(a.out, f"{name}_sheet_{si // per + 1:02d}.jpg")
        sheet.save(out, quality=85)
        sheets.append(out)
    print(f"{len(frames)} frames -> {fdir}")
    print("Contact sheets (Read tool se dekhein):")
    print("\n".join(sheets))

if __name__ == "__main__":
    main()
