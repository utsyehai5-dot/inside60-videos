# Inside 60 — Shorts production runbook (for Claude)

Channel: Inside 60 (@Inside60HQ). Vertical 3D "how it works in 60 seconds" Shorts, English, Andrew voice.
Owner talks Roman Urdu. Look: see shorts/s001-toaster (three.js scene + kit/template.html overlay:
INSIDE 60 header, countdown ring, numbered step pill, big yellow stat, word-by-word captions).

## FIRST STEP OF EVERY RUN — upload throttle check (cheap exit)
- Read /throttle.json (repo root). If now (UTC) < blocked_until: do NOTHING else (no rendering, no Zapier), report
  "upload limit — paused until <time Stockholm>" in one line and stop. This saves the owner's Claude usage.
- If any Zapier YouTube upload returns "throttled" (any wording with throttle / quota / rate limit): do NOT retry it
  in this run. Set throttle.json blocked_until = the next 08:15 UTC, commit + push, keep your work (see "ready" below), stop.

## Statuses: todo → ready → done
- "ready" = video rendered and its mp4 is committed at i60/up/ or mmf/up/ (pushed), with "file_url" (raw link by
  commit SHA, see step 5) and for MMF also "short_urls" + "thumb_url". A ready item never needs rendering again.
- Order of work in every run: (1) upload "ready" items, earliest publish_at first; (2) only then make new items.
- Total YouTube uploads (both channels together) per UTC day: at most 6. Count items with "uploaded_on" = today in
  BOTH queues (mmf/queue.json + i60/queue.json; an MMF episode counts 3). At the cap: just make/ready new items, don't upload.
- Keep making new items even when you can't upload (owner wants everything made and stored). Make items in
  publish_at order.
- FROM 2026-12-02 (Zapier free plan): production runs NEVER upload. They only make "ready" items. Uploading is done
  by the separate daily task "Daily uploader" (1 day before each publish date).
- Remove a file from */up/ only after its upload succeeded (the SHA link keeps working for Instagram).

## Rules
- Facts must be checked with a quick web search in this run (2–4 searches per short). No guessing numbers.
- 30–55 seconds total (render.py refuses > 59.5 s). 5–7 steps. Each step 1–2 short sentences.
  Step 1 = hook (surprising fact). Last step = 3–4 word recap + "Follow Inside 60 for more."
  Mark 1–2 keywords per step with *asterisks* (highlighted yellow in captions). Optional "stat"/"statsub".
- 3D only from code (three.js primitives, RoundedBoxGeometry, Tube, Lathe, Extrude...). Bright readable
  materials, emissive glow for energy/heat/flow, camera glides to a new shot each step (see toaster scene.js).
  Keep the subject in the middle band of the frame (y 400–1300 px) — top has the pill/stat, bottom has captions.
- No logos, no real brands, no people's faces.
- SPEED: use MeshPhongMaterial (+ a small canvas CubeTexture envMap if you want shine), not MeshStandardMaterial —
  Standard/PBR is ~5x slower in SwiftShader. Keep shadows off or one small shadow map.
- The separate daily task "Inside 60 daily Short" only posts the day's Short to Instagram/Facebook using file_url;
  it no longer makes or uploads YouTube videos. Don't make topics that are already on the channel
  (Jet engine, Refrigerator, Microwave oven, Toilet flush are done). Items with status "skip" are ignored; their date stays empty, that's fine.

## One run
1. `cd i60 && python3 -c "import json;q=json.load(open('queue.json'));print(next((i for i in q if i['status']=='todo'),'EMPTY'))"`
   Take the first "todo" item (and the next ones, as many as fit — about 3 per run). Set them "doing", commit + push
   immediately (git pull --rebase first) so a parallel run doesn't take them.
2. For each: write `shorts/<slug>/short.json` (title "How a X Works in 60 Seconds <2 emojis> #shorts",
   description 2–4 sentences + "Follow Inside 60 for a new \"how it works\" explained in 60 seconds." + 3 hashtags,
   tags list, steps) and `shorts/<slug>/scene.js` (export async function setup({THREE, scene, camera}) → {update(t, si, lt, sd)}).
3. Setup once per run: `cd i60/kit && npm i` (three + font), `pip install edge-tts --break-system-packages`.
   Render: `cd i60 && python3 kit/render.py shorts/<slug>` (~10–15 min each, run in background and poll;
   the shell tool times out at 10 min). Check out/check0..3.jpg with the Read tool. Fix and re-render if the
   subject is cut off, hidden behind UI, or a shot shows nothing.
4. Upload via Zapier YouTube "Upload Video" (selected_api YouTubeV4CLIAPI, tool youtube_upload_video),
   connection_id `021daa39-8c3c-859c-8b0f-225fcc754083` (= Inside 60 channel — NOT the other one).
   Host first: copy mp4 to `i60/up/<slug>.mp4`, `git add -f`, commit, push, URL
   https://raw.githubusercontent.com/utsyehai5-dot/inside60-videos/main/i60/up/<slug>.mp4
   Params: title, description, tags, privacy_status "private", publish_at (queue value), made_for_kids false,
   category_id "28", default_language "en", default_audio_language "en". (2 Zapier tasks per upload.)
5. Before deleting, save a permanent link for the Instagram/Facebook poster: `git rev-parse HEAD` of the commit that
   added the file → store in the queue item as
   "file_url": "https://raw.githubusercontent.com/utsyehai5-dot/inside60-videos/<sha>/i60/up/<slug>.mp4"
   (raw links by commit SHA keep working after the file is removed). Then `git rm` the file in i60/up/, set item status "done" + "video_id", commit only short.json,
   scene.js, queue.json (never out/), push.
6. If something fails (TTS, render, Zapier), set the item back to "todo" with a "last_error" note and push.

## Anti-spam rule (YouTube)
- (Superseded by the 6-per-day total above.) At most 12 uploads per channel per calendar day (UTC). Before uploading, count queue items with status "done"
  and an "uploaded_on" equal to today's UTC date; if 12 or more, put your items back to "todo" and stop.
  Always set "uploaded_on": "<YYYY-MM-DD UTC>" on items you upload. Publish dates stay 1 per day (Inside 60) /
  Sat + Tue + Thu (Money Machine Files), so viewers only ever see the normal rhythm.
