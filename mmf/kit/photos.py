"""Real photos via Openverse (Flickr, Wikimedia Commons, ...): only licenses that allow commercial use AND
modification (CC0, PDM, CC BY, CC BY-SA). Every photo carries an on-screen credit.
get(query, used) -> (PIL.Image RGB 1920 wide, credit_text) or (None, None). Cached in ./photos/.
Rules: search places, buildings, products, factories, shelves, machines — never search for a named person,
and skip photos where a person's face is the subject.
"""
import os, json, re, time, hashlib, urllib.parse, urllib.request, ssl
from PIL import Image

UA = "MMF-video-bot/1.0 (educational documentary)"
API = "https://api.openverse.org/v1/images/"
CACHE = "photos"
_ctx = None


def _ssl():
    global _ctx
    if _ctx is None:
        ca = os.path.expanduser("~/.ccr/ca-bundle.crt")
        _ctx = ssl.create_default_context(cafile=ca) if os.path.exists(ca) else ssl.create_default_context()
    return _ctx


def _get(url, binary=False):
    for k in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60, context=_ssl()) as r:
                data = r.read()
            return data if binary else json.loads(data.decode())
        except Exception as e:
            code = getattr(e, "code", None)
            if code in (403, 404):
                return None
            wait = 15 * (k + 1) if code == 429 else 4 * (k + 1)
            print(f"photo retry {k} ({code or e}) sleep {wait}s", flush=True)
            time.sleep(wait)
    return None


def _lic(r):
    l = (r.get("license") or "").upper()
    if l in ("CC0", "PDM"):
        return "Public domain" if l == "PDM" else "CC0"
    return f"CC {l} {r.get('license_version') or ''}".strip()


def get(query, used=None):
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.md5(query.encode()).hexdigest()[:12]
    meta_p = os.path.join(CACHE, key + ".json")
    if os.path.exists(meta_p):
        m = json.load(open(meta_p))
        if m.get("file") and os.path.exists(m["file"]):
            if used is not None:
                used.add(m["id"])
            return Image.open(m["file"]).convert("RGB"), m["credit"]
        return None, None
    q = urllib.parse.urlencode({"q": query, "license_type": "commercial,modification", "aspect_ratio": "wide",
                                "page_size": 20, "mature": "false"})
    d = _get(f"{API}?{q}") or {}
    for r in d.get("results", []):
        if used is not None and r["id"] in used:
            continue
        w, h = r.get("width") or 0, r.get("height") or 0
        if w and w < 900:
            continue
        data = _get(r["url"], binary=True)
        if not data:
            continue
        f = os.path.join(CACHE, key + ".jpg")
        open(f, "wb").write(data)
        try:
            img = Image.open(f).convert("RGB")
        except Exception:
            continue
        if img.width < 900 or img.width / max(1, img.height) < 1.2:
            continue
        if img.width != 1920:
            img = img.resize((1920, int(img.height * 1920 / img.width)), Image.LANCZOS)
        img.save(f, quality=92)
        src = (r.get("source") or r.get("provider") or "").replace("wikimedia", "Wikimedia Commons").title()
        credit = f"Photo: {(r.get('creator') or 'Unknown')[:36]} / {_lic(r)} / {src}"
        json.dump({"file": f, "id": r["id"], "credit": credit, "query": query, "landing": r.get("foreign_landing_url")}, open(meta_p, "w"))
        if used is not None:
            used.add(r["id"])
        time.sleep(1)
        return img, credit
    json.dump({"file": None}, open(meta_p, "w"))
    return None, None
