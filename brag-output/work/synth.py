"""Original soundtrack + SFX for the OES Pro brag video (one mix, one beat grid).

120 BPM, C major, I-V-vi-IV. Everything — drums, bass, pad, arp and the
sound effects — is placed on the same grid counted from frame 0.
"""
import json
import wave

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM          # 0.5 s
BAR = 4 * BEAT           # 2.0 s
DUR = 21.0
N = int(SR * DUR)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(round(start * SR))
    if i >= N:
        return
    sig = sig[: N - i]
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * left
    R[i:i + len(sig)] += sig * gain * right


def env_adsr(n, a, d, s, r_len):
    e = np.ones(n) * s
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r_len * SR)
    a_n = max(a_n, 1)
    e[:a_n] = np.linspace(0, 1, a_n)
    if d_n:
        e[a_n:a_n + d_n] = np.linspace(1, s, len(e[a_n:a_n + d_n]))
    if r_n:
        e[-r_n:] *= np.linspace(1, 0, r_n)
    return e


def lowpass(x, cutoff):
    # one-pole low-pass, enough for softening
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


# Bars: C G Am F C G Am F G C(held to the end)
CHORDS = [
    ("C", [48, 60, 64, 67], 36), ("G", [55, 59, 62, 67], 43), ("Am", [57, 60, 64, 69], 45), ("F", [53, 60, 65, 69], 41),
    ("C", [48, 60, 64, 67], 36), ("G", [55, 59, 62, 67], 43), ("Am", [57, 60, 64, 69], 45), ("F", [53, 60, 65, 69], 41),
    ("G", [55, 59, 62, 67], 43), ("C", [48, 60, 64, 67, 72], 36),
]
ARP = {"C": [72, 76, 79, 84], "G": [71, 74, 79, 83], "Am": [72, 76, 81, 84], "F": [72, 77, 81, 84]}

# ---------------- pad ----------------
for b, (name, notes, _root) in enumerate(CHORDS):
    start = b * BAR
    length = (DUR - start) if b == len(CHORDS) - 1 else BAR + 0.35
    n = int(length * SR)
    tt = np.arange(n) / SR
    e = env_adsr(n, 0.35, 0.4, 0.8, 0.45 if b < len(CHORDS) - 1 else 1.6)
    for k, m in enumerate(notes):
        for det, pan in ((-0.004, -0.5), (0.004, 0.5)):
            f = midi(m) * (1 + det)
            tone = np.sin(2 * np.pi * f * tt) + 0.18 * np.sin(4 * np.pi * f * tt) + 0.06 * np.sin(6 * np.pi * f * tt)
            add(tone * e, start, 0.022 if m >= 55 else 0.03, pan)

# ---------------- plucked arpeggio (8ths) with a soft echo ----------------
pattern = [0, 1, 2, 3, 2, 1, 2, 1]
for b, (name, _notes, _root) in enumerate(CHORDS):
    steps = 8 if b < len(CHORDS) - 1 else 4
    for s in range(steps):
        start = b * BAR + s * BEAT / 2
        if start >= DUR - 0.6:
            break
        m = ARP[name][pattern[s]]
        n = int(0.6 * SR)
        tt = np.arange(n) / SR
        f = midi(m)
        tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 9)
        tone *= np.minimum(1, tt / 0.004)
        level = 0.05 if start < 3.5 else 0.042
        pan = -0.35 if s % 2 == 0 else 0.35
        add(tone, start, level, pan)
        add(tone, start + 0.375, level * 0.32, -pan)   # dotted-8th echo, same grid
        add(tone, start + 0.75, level * 0.12, pan)

# ---------------- drums: enter on the reveal (3.5s) ----------------
def kick():
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    f = 45 + 75 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 11)


def hat():
    n = int(0.06 * SR)
    noise = rng.standard_normal(n)
    hp = np.diff(noise, prepend=0)  # crude high-pass
    return hp * np.exp(-np.arange(n) / SR * 70)


def clap():
    n = int(0.18 * SR)
    noise = lowpass(rng.standard_normal(n), 3000)
    noise = noise - lowpass(noise, 600)
    e = np.exp(-np.arange(n) / SR * 22)
    return noise * e


K, H, C = kick(), hat(), clap()
beat_times = np.arange(3.5, 18.01, BEAT)
for bt in beat_times:
    beat_in_bar = int(round((bt % BAR) / BEAT))
    if beat_in_bar in (0, 2):
        add(K, bt, 0.34)
    if bt >= 6.0 and beat_in_bar in (1, 3):
        add(C, bt, 0.10)
    add(H, bt + BEAT / 2, 0.05, 0.3)
add(K, 18.0, 0.34)  # final downbeat, then let it ring

# ---------------- sub bass ----------------
for b, (_name, _notes, root) in enumerate(CHORDS):
    for beat in (0, 2):
        start = b * BAR + beat * BEAT
        if start < 3.5 or start > 18.0:
            continue
        n = int(0.95 * SR)
        tt = np.arange(n) / SR
        tone = np.sin(2 * np.pi * midi(root) * tt) * env_adsr(n, 0.01, 0.2, 0.7, 0.3)
        add(tone, start, 0.16)
        if start >= 18.0:
            break

# ---------------- SFX (in key, on grid, tucked under the music) ----------------
def whoosh(length=0.55):
    n = int(length * SR)
    tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    swept = np.zeros(n)
    # rising band: blend of low-passed noise with cutoff climbing
    for lo, hi in ((0.0, 0.33), (0.33, 0.66), (0.66, 1.0)):
        a, b2 = int(lo * n), int(hi * n)
        swept[a:b2] = lowpass(noise[a:b2], 800 + 5000 * hi)
    e = (tt / length) ** 2.2
    e[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))
    return swept * e


def bell(m, length=1.6):
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = midi(m)
    tone = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 10)
    return tone * np.exp(-tt * 2.6) * np.minimum(1, tt / 0.003)


def blip(m):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * midi(m) * tt) * np.exp(-tt * 22) * np.minimum(1, tt / 0.002)


def tick():
    n = int(0.03 * SR)
    noise = lowpass(rng.standard_normal(n), 4000)
    return noise * np.exp(-np.arange(n) / SR * 160)


CUTS = [3.5, 6.0, 10.0, 14.0, 18.0]
for c in CUTS:
    add(whoosh(), c - 0.55, 0.11, 0.0)

CLICKS = [7.0, 13.0]
for c in CLICKS:
    add(tick(), c, 0.16)
    add(blip(84), c, 0.03)

CARD_POPS = [(7.5, 76), (8.0, 79), (8.5, 84), (9.0, 88)]      # F -> C bars, chord tones
for at, m in CARD_POPS:
    add(blip(m), at, 0.05, 0.2)
CHECKS = [(10.5, 74), (11.0, 79), (11.5, 83)]                # over G
for at, m in CHECKS:
    add(blip(m), at, 0.05, -0.2)

for m in (81, 84, 89):                                      # score lands (over F)
    add(bell(m), 15.0, 0.035)
for m in (84, 88, 91):                                      # outro (C)
    add(bell(m, 2.6), 18.0, 0.04)

# ---------------- master ----------------
mix = np.stack([L, R])
fade_in = int(0.15 * SR)
mix[:, :fade_in] *= np.linspace(0, 1, fade_in)
fade_from = int(19.6 * SR)
mix[:, fade_from:] *= np.linspace(1, 0, N - fade_from) ** 1.4
mix = np.tanh(mix * 1.6) / 1.6
peak = np.max(np.abs(mix))
mix = mix / peak * 10 ** (-4 / 20)     # -4 dBFS peak: subtle, not loud

pcm = (mix.T * 32767).astype(np.int16)
with wave.open("music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

# Kick envelope for the visuals (waves pulse with the drums)
kicks = [round(float(bt), 3) for bt in beat_times if int(round((bt % BAR) / BEAT)) in (0, 2)] + [18.0]
json.dump({"bpm": BPM, "kicks": kicks, "cuts": CUTS, "clicks": CLICKS}, open("beats.json", "w"))
print("music.wav written", DUR, "s")
