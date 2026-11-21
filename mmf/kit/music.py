import numpy as np, wave, sys
SR = 44100
total = float(sys.argv[1])
n = int(total * SR)
t = np.arange(n) / SR
out = np.zeros(n)
# chord progression Am - F - C - G, 8 s each
chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [130.81, 196.0, 261.63], [196.0, 246.94, 293.66]]
seg = 8.0
for k in range(int(total // seg) + 1):
    s0 = int(k * seg * SR)
    s1 = min(n, int((k + 1) * seg * SR) + SR)
    if s0 >= n:
        break
    tt = np.arange(s1 - s0) / SR
    env = np.minimum(1, tt / 2.0) * np.minimum(1, np.maximum(0, (seg + 1 - tt)) / 2.0)
    ch = chords[k % 4]
    sig = sum(np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * 2 * tt + 0.3) * 0.12 for f in ch)
    sig += np.sin(2 * np.pi * ch[0] / 2 * tt) * 0.6  # bass
    out[s0:s1] += sig * env
# soft pulse on each beat (~100 bpm)
beat = 60 / 100
for b in np.arange(0, total, beat):
    i0 = int(b * SR)
    L = int(0.12 * SR)
    if i0 + L >= n:
        break
    tt = np.arange(L) / SR
    out[i0:i0 + L] += np.sin(2 * np.pi * 60 * tt) * np.exp(-tt * 30) * 0.8
out /= np.max(np.abs(out))
# fade in/out
fi = int(3 * SR)
out[:fi] *= np.linspace(0, 1, fi)
out[-fi:] *= np.linspace(1, 0, fi)
data = (out * 0.9 * 32767).astype(np.int16)
st = np.stack([data, data], 1)
with wave.open("music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
