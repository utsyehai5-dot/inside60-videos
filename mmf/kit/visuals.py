from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1920, 1080
NAVY = (12, 18, 36)
NAVY2 = (24, 36, 68)
GOLD = (242, 184, 48)
GOLD2 = (255, 214, 102)
WHITE = (240, 244, 250)
GREY = (150, 164, 190)
CARD = (30, 44, 80)
BLUE = (64, 130, 220)
GREEN = (70, 190, 130)
RED = (220, 80, 80)
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FS = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FSI = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
_fc = {}


def F(path, size):
    k = (path, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def seg(t, start, dur=0.6):
    return ease((t - start) / dur)


def A(c, a):
    return (c[0], c[1], c[2], int(255 * max(0, min(1, a))))


# ---------------- background ----------------
_bg = None


def gear_pts(cx, cy, r, teeth, rot, tooth=0.2):
    pts = []
    n = teeth * 4
    for i in range(n):
        a = 2 * math.pi * i / n + rot
        rr = r * (1 + tooth) if (i % 4) in (1, 2) else r
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def background(gt):
    global _bg
    if _bg is None:
        _bg = Image.new("RGB", (W, H), NAVY)
        d = ImageDraw.Draw(_bg)
        for y in range(H):
            k = y / H
            d.line([(0, y), (W, y)], fill=tuple(int(NAVY2[i] + (NAVY[i] - NAVY2[i]) * k) for i in range(3)))
    img = _bg.copy()
    d = ImageDraw.Draw(img)
    for (cx, cy, r, teeth, sp) in [(-40, 1040, 260, 14, 0.05), (1960, 60, 200, 12, -0.065)]:
        d.polygon(gear_pts(cx, cy, r, teeth, gt * sp), fill=(28, 41, 74))
        d.ellipse([cx - r * .6, cy - r * .6, cx + r * .6, cy + r * .6], fill=(20, 30, 58))
    return img


def chrome(d, chapter_label):
    # small watermark bottom-left + chapter tag top-left
    gx, gy = 70, 1018
    d.polygon(gear_pts(gx, gy, 16, 10, 0), fill=A(GOLD, .9))
    d.ellipse([gx - 9, gy - 9, gx + 9, gy + 9], fill=A(NAVY, 1))
    d.text((gx, gy + 1), "$", font=F(FS, 14), fill=A(GOLD2, 1), anchor="mm")
    d.text((98, gy), "MONEY MACHINE FILES", font=F(FB, 20), fill=A(GREY, .8), anchor="lm")
    if chapter_label:
        d.text((70, 60), chapter_label.upper(), font=F(FB, 22), fill=A(GOLD, .85), anchor="lm")


def wrap(text, font, maxw, d):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textlength(test, font=font) <= maxw:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit(text, path, size, maxw, d):
    while d.textlength(text, font=F(path, size)) > maxw and size > 20:
        size -= 4
    return F(path, size)


# ---------------- visual types ----------------
# each: fn(d, t, *args) draws onto RGBA overlay at local time t (seconds); ANIM[type] = seconds until static

def v_title(d, t, big, sub):
    a = seg(t, 0, .8)
    f = fit(big, FB, 190, 1700, d)
    d.text((W / 2, 470 + 40 * (1 - a)), big, font=f, fill=A(GOLD, a), anchor="mm")
    b = seg(t, .5)
    d.text((W / 2, 640), sub, font=F(FR, 52), fill=A(WHITE, b), anchor="mm")
    w = 600 * seg(t, .3, .9)
    d.rectangle([W / 2 - w / 2, 575, W / 2 + w / 2, 580], fill=A(GOLD, a))


def v_quote(d, t, text, who):
    a = seg(t, 0, .9)
    f = F(FS, 76) if len(text) < 40 else F(FS, 62)
    lines = wrap(text, f, 1500, d)
    lh = f.size * 1.3
    y0 = H / 2 - lh * len(lines) / 2 - (30 if who else 0)
    d.text((W / 2, y0 - 70), "“", font=F(FS, 160), fill=A(GOLD, a * .8), anchor="mm")
    for i, ln in enumerate(lines):
        d.text((W / 2, y0 + lh * i + lh / 2 + 20 * (1 - a)), ln, font=f, fill=A(WHITE, a), anchor="mm")
    if who:
        d.text((W / 2, y0 + lh * len(lines) + 60), who, font=F(FSI, 42), fill=A(GOLD2, seg(t, .7)), anchor="mm")


def v_brand(d, t, label="", *_):
    a = seg(t, 0, 1)
    cx, cy = W / 2, 400
    r = 120 * (.6 + .4 * a)
    d.polygon(gear_pts(cx, cy, r, 12, (1 - a) * 1.5), fill=A(GOLD, a))
    d.ellipse([cx - r * .62, cy - r * .62, cx + r * .62, cy + r * .62], fill=A(NAVY, a))
    d.text((cx, cy + 4), "$", font=F(FS, int(r * .9)), fill=A(GOLD2, a), anchor="mm")
    b = seg(t, .5)
    d.text((cx, 650), "MONEY MACHINE FILES", font=F(FB, 96), fill=A(WHITE, b), anchor="mm")
    c = seg(t, 1.0)
    d.text((cx, 760), label, font=F(FB, 54), fill=A(GOLD, c), anchor="mm")


def v_chapter(d, t, num, title):
    a = seg(t, 0, .7)
    if num:
        d.text((W / 2, 400), f"CHAPTER {num}", font=F(FB, 48), fill=A(GOLD, a), anchor="mm")
    f = fit(title, FS, 120, 1700, d)
    d.text((W / 2, 530 + 30 * (1 - seg(t, .2)) ), title, font=f, fill=A(WHITE, seg(t, .2)), anchor="mm")
    w = 400 * seg(t, .4, .8)
    d.rectangle([W / 2 - w / 2, 630, W / 2 + w / 2, 636], fill=A(GOLD, 1))


def v_timeline(d, t, year, text):
    a = seg(t, 0, .8)
    # line
    w = 1500 * seg(t, 0, 1.0)
    d.rectangle([210, 640, 210 + w, 646], fill=A(GREY, .5))
    d.ellipse([W / 2 - 22, 621, W / 2 + 22, 665], fill=A(GOLD, a))
    d.ellipse([W / 2 - 10, 633, W / 2 + 10, 653], fill=A(NAVY, a))
    d.text((W / 2, 470 + 40 * (1 - a)), year, font=F(FB, 200), fill=A(GOLD, a), anchor="mm")
    b = seg(t, .5)
    f = fit(text, FR, 54, 1600, d)
    d.text((W / 2, 760), text, font=f, fill=A(WHITE, b), anchor="mm")


def v_acronym(d, t, *_):
    letters = [("I", "Ingvar"), ("K", "Kamprad"), ("E", "Elmtaryd"), ("A", "Agunnaryd")]
    for i, (L, word) in enumerate(letters):
        a = seg(t, i * .9, .7)
        x = 390 + i * 380
        d.rounded_rectangle([x - 150, 300, x + 150, 620], radius=30, fill=A(CARD, a))
        d.text((x, 450 - 20 * (1 - a)), L, font=F(FB, 200), fill=A(GOLD, a), anchor="mm")
        d.text((x, 700), word, font=F(FB, 46), fill=A(WHITE, a), anchor="mm")
        sub = ["founder", "founder", "his farm", "his village"][i]
        d.text((x, 760), sub, font=F(FR, 34), fill=A(GREY, a), anchor="mm")


def v_boycott(d, t, *_):
    a = seg(t, 0)
    # IKEA box in middle, factories left with X, globe right
    d.rounded_rectangle([810, 400, 1110, 620], radius=24, fill=A(CARD, a))
    d.text((960, 510), "IKEA", font=F(FB, 80), fill=A(GOLD, a), anchor="mm")
    b = seg(t, .6)
    for j in range(2):
        x, y = 300, 340 + j * 260
        d.rectangle([x - 110, y, x + 110, y + 140], fill=A(GREY, b * .6))
        d.polygon([(x - 110, y), (x - 50, y - 50), (x - 50, y), (x + 10, y - 50), (x + 10, y), (x + 110, y - 50), (x + 110, y)], fill=A(GREY, b * .6))
    d.text((300, 860), "Swedish suppliers", font=F(FB, 38), fill=A(WHITE, b), anchor="mm")
    c = seg(t, 1.3)
    d.line([(440, 510), (780, 510)], fill=A(RED, c), width=10)
    d.line([(560, 450), (660, 570)], fill=A(RED, c), width=14)
    d.line([(660, 450), (560, 570)], fill=A(RED, c), width=14)
    e = seg(t, 2.2)
    d.line([(1140, 510), (1440, 510)], fill=A(GREEN, e), width=10)
    d.polygon([(1440, 485), (1480, 510), (1440, 535)], fill=A(GREEN, e))
    cx, cy, r = 1640, 510, 130
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=A(GREEN, e), width=8)
    d.ellipse([cx - r * .45, cy - r, cx + r * .45, cy + r], outline=A(GREEN, e), width=5)
    d.line([(cx - r, cy), (cx + r, cy)], fill=A(GREEN, e), width=5)
    d.text((cx, 860), "New suppliers abroad", font=F(FB, 38), fill=A(WHITE, e), anchor="mm")
    d.text((960, 200), "Late 1950s: the boycott", font=F(FB, 60), fill=A(WHITE, a), anchor="mm")


def v_flatpack(d, t, *_):
    a = seg(t, 0)
    d.text((960, 160), "Same table. Different box.", font=F(FB, 64), fill=A(WHITE, a), anchor="mm")
    # left: assembled table in big box
    d.rectangle([260, 300, 760, 800], outline=A(GREY, a), width=6)
    d.rectangle([330, 430, 690, 470], fill=A(GOLD, a))
    for x in (350, 650):
        d.rectangle([x, 470, x + 22, 740], fill=A(GOLD, a))
    d.text((510, 860), "Assembled: big, fragile", font=F(FB, 40), fill=A(GREY, a), anchor="mm")
    b = seg(t, 1.2, .9)
    # right: flat box
    d.rectangle([1160, 640, 1660, 740], outline=A(GOLD, b), width=6)
    d.rectangle([1190, 660, 1630, 686], fill=A(GOLD, b))
    for k in range(2):
        d.rectangle([1200 + k * 230, 696, 1400 + k * 230, 718], fill=A(GOLD2, b))
    d.text((1410, 860), "Flat pack: small, safe", font=F(FB, 40), fill=A(GOLD, b), anchor="mm")
    c = seg(t, 2.0)
    d.text((960, 560), "→", font=F(FB, 120), fill=A(WHITE, c), anchor="mm")
    d.text((1410, 560), "up to many× more per truck", font=F(FR, 34), fill=A(WHITE, c * 0), anchor="mm")


def v_list(d, t, title, items):
    a = seg(t, 0)
    d.text((200, 230), title, font=F(FB, 70), fill=A(GOLD, a), anchor="lm")
    d.rectangle([200, 290, 200 + 300 * a, 296], fill=A(GOLD, a))
    for i, it in enumerate(items):
        b = seg(t, .6 + i * .7)
        y = 400 + i * 130
        x = 220 + 40 * (1 - b)
        d.rounded_rectangle([x, y - 50, x + 1480, y + 50], radius=20, fill=A(CARD, b))
        d.ellipse([x + 30, y - 18, x + 66, y + 18], fill=A(GOLD, b))
        d.text((x + 100, y), it, font=F(FB, 46), fill=A(WHITE, b), anchor="lm")


def v_stat(d, t, value, label, sub):
    a = seg(t, 0, .9)
    f = fit(value, FB, 230, 1700, d)
    d.text((W / 2, 440 + 40 * (1 - a)), value, font=f, fill=A(GOLD, a), anchor="mm")
    b = seg(t, .5)
    d.text((W / 2, 630), label, font=F(FB, 64), fill=A(WHITE, b), anchor="mm")
    c = seg(t, .9)
    d.text((W / 2, 730), sub, font=F(FR, 40), fill=A(GREY, c), anchor="mm")


def v_maze(d, t, *_):
    a = seg(t, 0)
    d.text((960, 140), "The one-way path", font=F(FB, 64), fill=A(WHITE, a), anchor="mm")
    stops = [("Showroom", 300, 380), ("Restaurant", 800, 380), ("Market hall", 1300, 380), ("Warehouse", 1300, 760), ("Checkout", 800, 760)]
    pts = [(x, y) for _, x, y in stops]
    prog = ease(t / 4.0) * (len(pts) - 1)
    for i in range(len(pts) - 1):
        p = max(0, min(1, prog - i))
        if p <= 0:
            continue
        x0, y0 = pts[i]
        x1, y1 = pts[i + 1]
        d.line([(x0, y0), (x0 + (x1 - x0) * p, y0 + (y1 - y0) * p)], fill=A(GOLD, 1), width=12)
    for i, (name, x, y) in enumerate(stops):
        b = max(0, min(1, (prog - i + 1) * 1.5)) if i else a
        d.rounded_rectangle([x - 190, y - 70, x + 190, y + 70], radius=22, fill=A(CARD, b), outline=A(GOLD, b), width=4)
        d.text((x, y), name, font=F(FB, 44), fill=A(WHITE, b), anchor="mm")
        d.text((x - 160, y - 100), str(i + 1), font=F(FB, 36), fill=A(GOLD, b), anchor="mm")
    c = seg(t, 4.2)
    d.text((1720, 580), "→ You", font=F(FB, 48), fill=A(GREEN, 0), anchor="mm")
    d.text((960, 930), "Every visitor passes every department", font=F(FR, 40), fill=A(GREY, c), anchor="mm")


def v_compare(d, t, lt, ll, rt, rl):
    for side, (title, lines, col) in enumerate([(lt, ll, GOLD), (rt, rl, BLUE)]):
        a = seg(t, side * .8, .7)
        x0 = 140 + side * 860
        d.rounded_rectangle([x0, 200 + 30 * (1 - a), x0 + 780, 900], radius=30, fill=A(CARD, a))
        d.rectangle([x0, 200 + 30 * (1 - a), x0 + 780, 214 + 30 * (1 - a)], fill=A(col, a))
        f = fit(title, FB, 56, 700, d)
        d.text((x0 + 390, 300), title, font=f, fill=A(col, a), anchor="mm")
        for i, ln in enumerate(lines):
            b = seg(t, side * .8 + .5 + i * .35)
            ff = fit(ln, FR, 42, 640, d)
            d.text((x0 + 70, 430 + i * 105), "•", font=F(FB, 44), fill=A(col, b), anchor="lm")
            d.text((x0 + 110, 430 + i * 105), ln, font=ff, fill=A(WHITE, b), anchor="lm")


def v_flow(d, t, title, nodes, labels, note="Money flows back the other way →  you pay the store, the store pays Inter IKEA", hi="Inter"):
    a = seg(t, 0)
    d.text((960, 220), title, font=F(FB, 66), fill=A(WHITE, a), anchor="mm")
    n = len(nodes)
    xs = [260 + i * (1400 / (n - 1)) for i in range(n)]
    for i, (x, name) in enumerate(zip(xs, nodes)):
        b = seg(t, i * .8)
        col = GOLD if name.startswith(hi) else BLUE if name == "Stores" else GREY
        d.rounded_rectangle([x - 150, 470, x + 150, 610], radius=26, fill=A(CARD, b), outline=A(col, b), width=5)
        f = fit(name, FB, 44, 260, d)
        d.text((x, 540), name, font=f, fill=A(WHITE, b), anchor="mm")
        if i < n - 1:
            c = seg(t, i * .8 + .5)
            x1 = x + 160
            x2 = xs[i + 1] - 170
            d.line([(x1, 540), (x1 + (x2 - x1) * c, 540)], fill=A(GOLD, c), width=8)
            d.polygon([(x2 - 4, 522), (x2 + 14, 540), (x2 - 4, 558)], fill=A(GOLD, c))
            d.text(((x1 + x2) / 2, 500), labels[i], font=F(FR, 28), fill=A(GOLD2, c), anchor="mm")
    e = seg(t, n * .8)
    d.text((960, 760), note, font=F(FR, 36), fill=A(GREY, e), anchor="mm")


def v_bars(d, t, title, rows):
    a = seg(t, 0)
    d.text((200, 220), title, font=F(FB, 62), fill=A(WHITE, a), anchor="lm")
    mx = max(r[1] for r in rows)
    for i, (lab, val, disp) in enumerate(rows):
        b = seg(t, .4 + i * .6, 1.0)
        y = 400 + i * (190 if len(rows) <= 3 else 140)  # 4 rows: keep clear of captions
        d.text((200, y), lab, font=F(FB, 44), fill=A(GREY, min(1, b * 2)), anchor="lm")
        wmax = 1100
        w = max(8, wmax * val / mx) * b
        d.rounded_rectangle([200, y + 40, 200 + w, y + 110], radius=12, fill=A(GOLD if i == 0 else BLUE if i == 1 else GREEN, 1 if b > 0 else 0))
        d.text((220 + w + 10, y + 75), disp, font=F(FB, 50), fill=A(WHITE, b), anchor="lm")


def v_pie(d, t, pct, label):
    a = seg(t, 0)
    p = float(pct.strip("%")) / 100
    cx, cy, r = 620, 540, 260
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=A(CARD, a))
    e = 360 * p * seg(t, .3, 1.2)
    if e > 0:
        d.pieslice([cx - r, cy - r, cx + r, cy + r], -90, -90 + e, fill=A(GOLD, 1))
    d.ellipse([cx - r * .55, cy - r * .55, cx + r * .55, cy + r * .55], fill=A(NAVY, a))
    d.text((cx, cy), pct, font=F(FB, 110), fill=A(GOLD, a), anchor="mm")
    b = seg(t, .9)
    lines = wrap(label, F(FB, 60), 800, d)
    for i, ln in enumerate(lines):
        d.text((1000, 470 + i * 80), ln, font=F(FB, 60), fill=A(WHITE, b), anchor="lm")


def v_ownership(d, t, *_):
    a = seg(t, 0)
    d.text((960, 140), "Who owns IKEA?", font=F(FB, 64), fill=A(WHITE, a), anchor="mm")
    def box(x, y, txt, col, al, w=560):
        d.rounded_rectangle([x - w / 2, y - 60, x + w / 2, y + 60], radius=22, fill=A(CARD, al), outline=A(col, al), width=5)
        d.text((x, y), txt, font=fit(txt, FB, 40, w - 40, d), fill=A(WHITE, al), anchor="mm")
    def arrow(x, y0, y1, al):
        d.line([(x, y0), (x, y0 + (y1 - y0) * al)], fill=A(GREY, al), width=6)
    L, R = 560, 1360
    b = [seg(t, k * .7) for k in range(6)]
    box(L, 300, "Stichting INGKA Foundation", GOLD, b[0])
    arrow(L, 360, 440, b[1]); box(L, 500, "Ingka Holding B.V.", BLUE, b[1])
    arrow(L, 560, 640, b[2]); box(L, 700, "Ingka Group (stores)", BLUE, b[2])
    box(R, 300, "Inter IKEA Foundation", GOLD, b[3])
    arrow(R, 360, 640, b[4]); box(R, 700, "Inter IKEA Group (brand)", GOLD, b[4])
    c = seg(t, 3.6)
    d.line([(L + 290, 700), (R - 290, 700)], fill=A(GOLD2, c), width=6)
    d.text((960, 745), "3% fee + wholesale", font=F(FR, 30), fill=A(GOLD2, c), anchor="mm")
    d.text((960, 880), "No stock market. No outside shareholders.", font=F(FB, 44), fill=A(GREY, seg(t, 4.2)), anchor="mm")


def v_split(d, t, a85, a15):
    a = seg(t, 0)
    d.text((960, 200), "Where Ingka's profit goes", font=F(FB, 64), fill=A(WHITE, a), anchor="mm")
    x0, x1, y0, y1 = 200, 1720, 420, 600
    p = seg(t, .4, 1.2)
    split = x0 + (x1 - x0) * .85
    d.rounded_rectangle([x0, y0, x0 + (split - x0) * p, y1], radius=20, fill=A(BLUE, 1 if p > 0 else 0))
    b = seg(t, 1.4)
    d.rounded_rectangle([split + 10, y0, x1, y1], radius=20, fill=A(GOLD, b))
    d.text(((x0 + split) / 2, 510), "85%", font=F(FB, 90), fill=A(WHITE, b), anchor="mm")
    d.text((split + (x1 - split) / 2 + 5, 510), "15%", font=F(FB, 54), fill=A(NAVY, b), anchor="mm")
    d.text(((x0 + split) / 2, 680), "Reinvested in the business", font=F(FB, 44), fill=A(WHITE, b), anchor="mm")
    d.text((1540, 680), "To the INGKA Foundation", font=F(FB, 36), fill=A(GOLD, b), anchor="mm")
    d.text((1540, 730), "→ IKEA Foundation", font=F(FR, 32), fill=A(GOLD2, seg(t, 2)), anchor="mm")


def v_machine(d, t, *_):
    a = seg(t, 0)
    d.text((960, 120), "The IKEA money machine", font=F(FB, 64), fill=A(GOLD, a), anchor="mm")
    items = ["Flat packs cut transport & storage costs", "Customers assemble for free",
             "Maze + meatballs = bigger baskets", "Huge volume = cheaper factory prices",
             "Franchisees run stores & carry costs", "Brand owner earns twice: wholesale + 3%"]
    cx, cy = 960, 590
    rot = t * .25
    d.polygon(gear_pts(cx, cy, 120, 12, rot), fill=A(GOLD, a))
    d.ellipse([cx - 74, cy - 74, cx + 74, cy + 74], fill=A(NAVY, a))
    d.text((cx, cy + 4), "$", font=F(FS, 100), fill=A(GOLD2, a), anchor="mm")
    for i, it in enumerate(items):
        b = seg(t, .6 + i * .9)
        col, row = i % 2, i // 2
        x = 140 if col == 0 else 1180
        y = 330 + row * 230
        d.rounded_rectangle([x, y, x + 600, y + 130], radius=20, fill=A(CARD, b))
        lines = wrap(it, F(FB, 36), 540, d)
        for k, ln in enumerate(lines):
            d.text((x + 300, y + 65 + (k - (len(lines) - 1) / 2) * 46), ln, font=F(FB, 36), fill=A(WHITE, b), anchor="mm")


def v_end(d, t, *_):
    a = seg(t, 0)
    cx, cy = 960, 380
    d.polygon(gear_pts(cx, cy, 110, 12, t * .3), fill=A(GOLD, a))
    d.ellipse([cx - 68, cy - 68, cx + 68, cy + 68], fill=A(NAVY, a))
    d.text((cx, cy + 4), "$", font=F(FS, 90), fill=A(GOLD2, a), anchor="mm")
    d.text((960, 600), "MONEY MACHINE FILES", font=F(FB, 90), fill=A(WHITE, a), anchor="mm")
    b = seg(t, .8)
    d.rounded_rectangle([760, 700, 1160, 800], radius=50, fill=A((204, 0, 0), b))
    d.text((960, 750), "SUBSCRIBE", font=F(FB, 46), fill=A(WHITE, b), anchor="mm")
    c = seg(t, 1.6)
    d.text((960, 890), "Which company should we open next? Tell us in the comments.", font=F(FR, 40), fill=A(GREY, c), anchor="mm")


def v_none(d, t, *_):
    pass


FUNCS = dict(none=v_none, title=v_title, quote=v_quote, brand=v_brand, chapter=v_chapter, timeline=v_timeline,
             acronym=v_acronym, boycott=v_boycott, flatpack=v_flatpack, list=v_list, stat=v_stat,
             maze=v_maze, compare=v_compare, flow=v_flow, bars=v_bars, pie=v_pie, ownership=v_ownership,
             split=v_split, machine=v_machine, end=v_end)
ANIM = dict(none=0, title=1.5, quote=1.7, brand=2, chapter=1.3, timeline=1.6, acronym=3.5, boycott=3, flatpack=3,
            list=4.5, stat=1.6, maze=4.9, compare=4, flow=4.5, bars=3, pie=2, ownership=5, split=2.8,
            machine=99, end=99)  # 99 = always animated (rotating gear)


def overlay(spec, t, chapter_label):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    kind = spec[0]
    FUNCS[kind](d, t, *spec[1:])
    if kind not in ("brand", "end", "chapter"):
        chrome(d, chapter_label)
    return img
