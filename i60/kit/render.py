"""Inside 60 Short renderer (3D with three.js, filmed in headless Chrome).
Usage (from repo root i60/):  python3 kit/render.py shorts/<slug>
The short folder needs short.json and scene.js (see shorts/README.md). Output: shorts/<slug>/out/<slug>.mp4
"""
import os, sys, json, ssl, asyncio, subprocess, re, html, threading, functools, http.server, socketserver

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # i60/
KIT = os.path.join(ROOT, "kit")
SD = os.path.abspath(sys.argv[1]); SLUG = os.path.basename(SD)
OUT = os.path.join(SD, "out"); os.makedirs(OUT, exist_ok=True)
SPEC = json.load(open(os.path.join(SD, "short.json")))
FPS, GAP = 30, 0.25


def sh(*a):
    subprocess.run(a, check=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())


def voice():
    import edge_tts, edge_tts.communicate as c
    ca = os.path.expanduser("~/.ccr/ca-bundle.crt")
    if os.path.exists(ca):
        c._SSL_CTX = ssl.create_default_context(cafile=ca)

    async def one(i, text):
        mp3 = os.path.join(OUT, f"v{i:02d}.mp3"); js = mp3 + ".words.json"
        if os.path.exists(js):
            return json.load(open(js))
        for k in range(10):
            try:
                com = edge_tts.Communicate(text, "en-US-AndrewNeural", rate="+8%", boundary="WordBoundary")
                words, audio = [], bytearray()
                async for ch in com.stream():
                    if ch["type"] == "audio":
                        audio += ch["data"]
                    elif ch["type"] == "WordBoundary":
                        words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
                if not audio or not words:
                    raise RuntimeError("empty")
                open(mp3, "wb").write(audio); json.dump(words, open(js, "w"))
                return words
            except Exception as e:
                print("tts retry", i, e, flush=True); await asyncio.sleep(6)
        raise SystemExit("TTS failed")

    async def main():
        return [await one(i, re.sub(r"\*", "", s["text"])) for i, s in enumerate(SPEC["steps"])]
    return asyncio.run(main())


def timeline(words_per_step):
    steps, groups, t = [], [], 0.0
    lst = open(os.path.join(OUT, "alist.txt"), "w")
    for i, (s, words) in enumerate(zip(SPEC["steps"], words_per_step)):
        mp3 = os.path.join(OUT, f"v{i:02d}.mp3"); d = dur(mp3) + GAP
        wav = os.path.join(OUT, f"p{i:02d}.wav")
        sh("ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", "apad", "-t", f"{d:.4f}", "-ar", "44100", "-ac", "2", wav)
        lst.write(f"file 'p{i:02d}.wav'\n")
        steps.append({"s": t, "e": t + d, "label": s.get("label", ""), "stat": s.get("stat", ""), "statsub": s.get("statsub", "")})
        keys = {w.strip("*.,!?").lower() for w in re.findall(r"\*([^*]+)\*", s["text"]) for w in w.split()}
        chunk = []
        for j, (a, b, w) in enumerate(words):
            chunk.append((a, w))
            end_sentence = w.endswith((".", "?", "!", ","))
            if len(chunk) == 3 or end_sentence or j == len(words) - 1:
                gs = t + chunk[0][0]
                ge = t + (words[j + 1][0] if j + 1 < len(words) else d - GAP / 2)
                h = " ".join(f'<span class="k">{html.escape(x)}</span>' if x.strip(".,!?").lower() in keys else html.escape(x) for _, x in chunk)
                groups.append({"s": gs, "e": ge, "html": h})
                chunk = []
        t += d
    lst.close()
    sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(OUT, "alist.txt"), "-c", "copy", os.path.join(OUT, "voice.wav"))
    tl = {"total": t, "steps": steps, "groups": groups}
    json.dump(tl, open(os.path.join(SD, "timeline.json"), "w"))
    return tl


def film(tl):
    page = os.path.join(KIT, f"_page_{SLUG}.html")
    tpl = open(os.path.join(KIT, "template.html")).read()
    rel = os.path.relpath(SD, KIT)
    open(page, "w").write(tpl.replace("__TIMELINE__", f"{rel}/timeline.json").replace("__SCENE__", f"./{rel}/scene.js"))
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    handler.log_message = lambda *a: None
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    from playwright.sync_api import sync_playwright
    n = int(tl["total"] * FPS)
    tmp = os.path.join(OUT, "video.tmp.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1080, "height": 1920})
        pg.on("console", lambda m: print("page:", m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: print("PAGE ERROR:", e))
        pg.goto(f"http://127.0.0.1:{port}/kit/_page_{SLUG}.html")
        pg.wait_for_function("window.READY === true", timeout=60000)
        for f in range(n):
            pg.evaluate(f"window.renderAt({f / FPS})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
            if f % 150 == 0:
                print("frame", f, "/", n, flush=True)
        b.close()
    ff.stdin.close(); assert ff.wait() == 0
    srv.shutdown(); os.remove(page)
    os.rename(tmp, os.path.join(OUT, "video.mp4"))


def music_and_mux(tl):
    mus = os.path.join(OUT, "music.wav")
    subprocess.run(["python3", os.path.join(ROOT, "..", "mmf", "kit", "music.py"), str(tl["total"])], cwd=OUT, check=True)
    final = os.path.join(OUT, f"{SLUG}.mp4")
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(OUT, "video.mp4"), "-i", os.path.join(OUT, "voice.wav"), "-i", mus,
       "-filter_complex", "[2:a]volume=0.08[m];[1:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]",
       "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", final)
    for k, x in enumerate((0.1, 0.4, 0.7, 0.95)):
        sh("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{tl['total'] * x:.2f}", "-i", final, "-frames:v", "1", "-vf", "scale=360:-1", os.path.join(OUT, f"check{k}.jpg"))
    print("DONE", final, round(tl["total"], 1), "s")


if __name__ == "__main__":
    words = voice()
    tl = timeline(words)
    assert tl["total"] <= 59.5, f"too long: {tl['total']:.1f}s — shorten the script"
    film(tl)
    music_and_mux(tl)
