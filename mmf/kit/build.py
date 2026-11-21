"""Money Machine Files episode builder.
Run from an episode folder that has scenes.py and meta.json:
    python3 ../../kit/build.py            # voice + render + final mp4 + thumbnail + shorts
Outputs go to ./out/ (git-ignored except when force-added for upload).
"""
import os, sys, json, ssl, asyncio, subprocess, math
from multiprocessing import Pool

KIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, KIT)
sys.path.insert(0, os.getcwd())
from PIL import Image, ImageDraw
from visuals import overlay, background, ANIM, W, H, F, FB, FR, FS, gear_pts, GOLD, GOLD2, WHITE, GREY, NAVY
from scenes import SCENES

FPS, PAD = 30, 0.6
META = json.load(open("meta.json"))
SLUG = os.path.basename(os.getcwd())
os.makedirs("audio", exist_ok=True); os.makedirs("vid", exist_ok=True); os.makedirs("out", exist_ok=True)


def sh(*a):
    subprocess.run(a, check=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())


# ---------------- voice (free Microsoft Andrew voice) ----------------
def voice():
    import edge_tts, edge_tts.communicate as c
    ca = os.path.expanduser("~/.ccr/ca-bundle.crt")
    if os.path.exists(ca):  # session proxy CA
        c._SSL_CTX = ssl.create_default_context(cafile=ca)

    async def one(i, text):
        out = f"audio/s{i:02d}.mp3"
        if os.path.exists(out) and os.path.getsize(out) > 1000:
            return
        for k in range(10):
            try:
                await edge_tts.Communicate(text, "en-US-AndrewNeural", rate="+6%").save(out + ".tmp.mp3")
                os.rename(out + ".tmp.mp3", out); return
            except Exception as e:
                print("tts retry", i, e, flush=True); await asyncio.sleep(6)
        raise SystemExit(f"TTS failed for scene {i}")

    async def main():
        for i, s in enumerate(SCENES):
            await one(i, s["t"])
    asyncio.run(main())
    durs = [dur(f"audio/s{i:02d}.mp3") for i in range(len(SCENES))]
    json.dump(durs, open("audio/durs.json", "w"))
    lst = open("audio/list.txt", "w")
    for i, x in enumerate(durs):
        sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"audio/s{i:02d}.mp3", "-af", "apad", "-t", f"{x + PAD:.4f}", "-ar", "44100", "-ac", "2", f"audio/p{i:02d}.wav")
        lst.write(f"file 'p{i:02d}.wav'\n")
    lst.close()
    sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "audio/list.txt", "-c", "copy", "audio/voice.wav")
    return durs


# ---------------- video ----------------
def labels():
    out, cur = [], ""
    for s in SCENES:
        if s["v"][0] == "chapter":
            cur = f"Chapter {s['v'][1]} · {s['v'][2]}" if s["v"][1] else s["v"][2]
        out.append(cur)
    return out


def render_scene(args):
    i, D, start, label = args
    out = f"vid/s{i:02d}.mp4"
    if os.path.exists(out):
        return i
    n = int(round(D * FPS)); spec = SCENES[i]["v"]; anim = ANIM[spec[0]]; cached = None
    tmp = out + ".tmp.mp4"
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp], stdin=subprocess.PIPE)
    for f in range(n):
        t = f / FPS
        bg = background(start + t)
        if t < anim:
            ov = overlay(spec, t, label)
        else:
            if cached is None:
                cached = overlay(spec, anim, label)
            ov = cached
        fr = Image.alpha_composite(bg.convert("RGBA"), ov).convert("RGB")
        k = (D - t) / 0.3
        if k < 1:
            fr = Image.blend(bg, fr, max(0, k))
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    if p.wait() == 0:
        os.rename(tmp, out)
    return i


def video(durs):
    lab = labels(); starts = [0.0]
    for d in durs:
        starts.append(starts[-1] + d + PAD)
    jobs = [(i, durs[i] + PAD, starts[i], lab[i]) for i in range(len(SCENES))]
    with Pool(os.cpu_count() or 2) as pool:
        for i in pool.imap_unordered(render_scene, jobs):
            print("scene", i, flush=True)
    with open("vid/list.txt", "w") as f:
        for i in range(len(SCENES)):
            f.write(f"file 's{i:02d}.mp4'\n")
    sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "vid/list.txt", "-c", "copy", "vid/all.mp4")
    total = sum(d + PAD for d in durs)
    sh("python3", os.path.join(KIT, "music.py"), str(total))
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", "audio/voice.wav", "-i", "music.wav", "-filter_complex",
       "[1:a]volume=0.07[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "44100", "-c:a", "aac", "-b:a", "192k", "audio/mix.m4a")
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", "vid/all.mp4", "-i", "audio/mix.m4a", "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", "-movflags", "+faststart", f"out/{SLUG}.mp4")
    # chapters for the description
    ch, t = ["0:00 Intro"], 0.0
    for s, d in zip(SCENES, durs):
        if s["v"][0] == "chapter":
            name = f"Chapter {s['v'][1]} – {s['v'][2]}" if s["v"][1] else s["v"][2]
            ch.append(f"{int(t // 60)}:{int(t % 60):02d} {name}")
        t += d + PAD
    open("out/chapters.txt", "w").write("\n".join(ch))
    # contact sheet for checking
    for k, tt in enumerate([total * x for x in (0.05, 0.3, 0.55, 0.8)]):
        sh("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{tt:.1f}", "-i", f"out/{SLUG}.mp4", "-frames:v", "1", "-vf", "scale=640:-1", f"out/check{k}.png")
    print("TOTAL", round(total / 60, 2), "min")


# ---------------- thumbnail ----------------
def thumb():
    m = META["thumb"]; Wt, Ht = 1280, 720
    img = Image.new("RGB", (Wt, Ht), NAVY); d = ImageDraw.Draw(img)
    for y in range(Ht):
        k = y / Ht; d.line([(0, y), (Wt, y)], fill=(int(30 - 18 * k), int(46 - 28 * k), int(90 - 54 * k)))
    cx, cy = 1000, 330
    d.polygon(gear_pts(cx, cy, 170, 12, 0.1), fill=GOLD)
    d.ellipse([cx - 108, cy - 108, cx + 108, cy + 108], fill=NAVY)
    d.text((cx, cy + 6), m.get("symbol", "$"), font=F(FB, 150), fill=GOLD2, anchor="mm")
    def fit(txt, size, maxw):
        while d.textlength(txt, font=F(FB, size)) > maxw and size > 30:
            size -= 4
        return F(FB, size)
    d.text((60, 120), m["l1"], font=fit(m["l1"], 104, 760), fill=WHITE, anchor="lm")
    d.text((60, 250), m["l2"], font=fit(m["l2"], 128, 760), fill=GOLD, anchor="lm")
    d.text((60, 380), m["l3"], font=fit(m["l3"], 88, 760), fill=WHITE, anchor="lm")
    bf = fit(m["badge"], 40, 640); bw = d.textlength(m["badge"], font=bf)
    d.rounded_rectangle([60, 470, 60 + bw + 60, 560], radius=18, fill=(204, 30, 30))
    d.text((90 + bw / 2, 515), m["badge"], font=bf, fill=WHITE, anchor="mm")
    img.save(f"out/{SLUG}_thumb.png")


# ---------------- vertical shorts cut from the episode ----------------
def shorts(durs):
    for n, s in enumerate(META.get("shorts", [])):
        Wv, Hv = 1080, 1920
        img = Image.new("RGB", (Wv, Hv), NAVY); d = ImageDraw.Draw(img)
        for y in range(Hv):
            k = y / Hv; d.line([(0, y), (Wv, y)], fill=(int(26 - 14 * k), int(40 - 22 * k), int(76 - 40 * k)))
        for j, (txt, col) in enumerate(zip(s["top"], [WHITE, WHITE, GOLD])):
            size = 120 if j == 2 else 96
            while d.textlength(txt, font=F(FB, size)) > 1000:
                size -= 4
            d.text((Wv / 2, 330 + j * 120), txt, font=F(FB, size), fill=col, anchor="mm")
        cx, cy = Wv / 2, 1480
        d.polygon(gear_pts(cx, cy, 60, 12, 0), fill=GOLD); d.ellipse([cx - 37, cy - 37, cx + 37, cy + 37], fill=NAVY)
        d.text((cx, cy + 3), "$", font=F(FS, 52), fill=GOLD2, anchor="mm")
        d.text((Wv / 2, 1600), "MONEY MACHINE FILES", font=F(FB, 54), fill=WHITE, anchor="mm")
        d.text((Wv / 2, 1680), "Full documentary on the channel", font=F(FR, 40), fill=GREY, anchor="mm")
        img.save(f"out/short{n}_bg.png")
        with open("vid/sl.txt", "w") as fv, open("audio/sl.txt", "w") as fa:
            for i in s["scenes"]:
                fv.write(f"file 's{i:02d}.mp4'\n"); fa.write(f"file 'p{i:02d}.wav'\n")
        sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "vid/sl.txt", "-c", "copy", "vid/short.mp4")
        sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "audio/sl.txt", "-c", "copy", "audio/short.wav")
        D = dur("audio/short.wav")
        assert D <= 59.5, f"short {n} is {D:.1f}s, must be under 60s"
        sh("ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", f"out/short{n}_bg.png", "-i", "vid/short.mp4", "-i", "audio/short.wav", "-i", "music.wav",
           "-filter_complex", f"[0:v]format=yuv420p,loop=-1:1,trim=duration={D}[bg];[1:v]scale=1080:608[fg];[bg][fg]overlay=0:720:shortest=1,format=yuv420p[v];[3:a]atrim=0:{D},volume=0.07[m];[2:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]",
           "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-t", str(D), "-movflags", "+faststart", f"out/{SLUG}_short{n}.mp4")
        print("short", n, round(D, 1), "s")


if __name__ == "__main__":
    durs = voice()
    video(durs)
    thumb()
    shorts(durs)
