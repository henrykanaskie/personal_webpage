"""The code-drawn line drawings, one per spec in svgs/specs: each a single real
object, like the site's other plates.

    python3 svgs/draw/scenes.py gptScratch      # writes svgs/svg_data/gptScratch.svg
    python3 svgs/draw/scenes.py --all

Then trim and preview them like any traced drawing: python3 svgs/convert.py <name>.
Needs shapely (pip install shapely) for the hidden-line removal in iso.py.
"""

import math
import sys
from pathlib import Path

from shapely.geometry import Polygon

sys.path.insert(0, str(Path(__file__).resolve().parent))
from iso import (P, Scene, add, circle3, contour_cylinder, cylinder, dashed, hatch, mul, norm,  # noqa: E402
                 plane_pts, rbox, rounded_rect, rslab, sphere, sprite, tube)

OUT = Path(__file__).resolve().parent.parent / "svg_data"





# Every drawing is one object, drawn like the site's other plates (the rocket,
# the chip, the thruster): a real piece of hardware in three-quarter view, bold
# outline, fine detail, its working parts showing. Each faces +x; the scenes
# for right-column cards are mirrored so they face into their card.

X_, Y_, Z_ = (1, 0, 0), (0, 1, 0), (0, 0, 1)



def rrect_on(o, ex, ey, cx, cy, w, h, r, n=5):
    """A rounded rectangle drawn on a plane (in its units), closed, to screen."""
    pts = rounded_rect(cx, cy, w, h, r, n)
    return plane_pts(o, ex, ey, pts + pts[:1])


def dash_rows(o, ex, ey, x0, y_top, width, rows, spacing, rng, indents=(0, 1, 1, 2, 2, 1, 0, 1, 2, 1), unit=1.6,
              last_partial=False):
    """Rows of code (dashes with indentation) on a plane; rows go down -ey."""
    out = []
    for r in range(rows):
        y = y_top - r * spacing
        x = x0 + indents[r % len(indents)] * unit
        end = x0 + width * (0.45 if (last_partial and r == rows - 1) else rng.uniform(0.6, 1.0))
        while x < end:
            w = rng.uniform(0.8, 2.6) * unit / 1.6
            out.append(plane_pts(o, ex, ey, [(x, y), (min(x + w, end), y)]))
            x += w + 0.55 * unit / 1.6
    return out



# ── Monte Carlo: a Galton board ──────────────────────────────────────────────
# The physical Monte Carlo machine: balls fall through a lattice of pegs into
# bins. The bell curve printed on its back panel is the Gaussian; the piles
# run past it on the left, the fat tail the engine exists to show.


def monteCarlo():
    s = Scene(mirror=False, seed=11, bold=0.45)
    rng = s.rng
    # the board faces the viewer: width along the screen-flat direction
    EX = norm((1, -0.55, 0))  # across the board: turned a little from face-on
    EN = norm((0.55, 1, 0))   # out of the board, toward the viewer
    Wd, H = 42, 72
    O = (0, 0, 0)          # bottom-left corner of the back panel's face
    at = lambda a, z, n=0.0: add(O, add(mul(EX, a), add(mul(Z_, z), mul(EN, n))))

    # base with feet
    s.add(*rslab(at(-4, -5, -6), EX, EN, Z_, Wd + 8, 13, 5, r=2, shade=0.25, rng=rng))
    # back panel with the Gaussian printed behind the bins
    s.add(*rslab(at(0, 0, -2.5), EX, Z_, EN, Wd, H - 2, 2.5, r=0.4, shade=0, rng=rng))
    BIN0, NB, BW = 1.9, 13, 2.93
    counts = [1, 1, 2, 2, 3, 4, 6, 6, 5, 3, 1, 0, 0]
    peak, mu, sd = 6.3, 6.95, 1.7
    curve = [at(BIN0 + BW * q, 1.0 + 2.35 * peak * math.exp(-0.5 * ((q - mu) / sd) ** 2), 0.02) for q in [t / 8 for t in range(0, NB * 8 + 1)]]
    s.add(dashed([P(c) for c in curve], 1.3, 0.9), outline=False)
    R = 1.15
    # hopper: two slanted boards and the balls waiting in it
    for side in (-1, 1):
        a = (Wd / 2 + side * 17, H - 6)
        b = (Wd / 2 + side * 2.4, H - 18)
        s.add([[P(at(a[0], a[1], 1.5)), P(at(b[0], b[1], 1.5))], [P(at(a[0] + side * 1.2, a[1] + 0.8, 1.5)), P(at(b[0] + side * 1.2, b[1] + 0.6, 1.5))]],
              heavy=[[P(at(a[0], a[1], 1.5)), P(at(b[0], b[1], 1.5))]])
    for row in range(4):
        n = 13 - row * 3
        for i in range(n):
            s.add(*sphere(at(Wd / 2 - (n - 1) * R + i * 2 * R, H - 7.5 - row * 2.15, 1.5), R, rng, dots=5))
    # peg lattice
    top, rows, dy, dz = H - 22, 11, 2.93, 2.95
    for k in range(rows):
        n = k + 3
        for i in range(n):
            a = Wd / 2 + (i - (n - 1) / 2) * dy
            s.add(*cylinder(at(a, top - k * dz, 1.2), at(a, top - k * dz, 2.4), 0.45, n=20))
    for k, off in [(1, 0.5), (4, -1.5), (6, 1.5), (9, -0.5)]:
        s.add(*sphere(at(Wd / 2 + off * dy, top - k * dz - dz / 2, 1.5), R, rng, dots=5))
    # bins
    for b in range(NB + 1):
        s.add(*rslab(at(BIN0 + b * BW - 0.28, 0, 0), EX, Z_, EN, 0.56, 17, 3, r=0.2, shade=0, rng=rng))
    for b, c in enumerate(counts):
        for j in range(c):
            s.add(*sphere(at(BIN0 + (b + 0.5) * BW, 1.25 + j * 2.35, 1.5), R, rng, dots=5))
    # glass reflections
    s.add([[P(at(5, 36, 3.2)), P(at(12, 47, 3.2))], [P(at(7, 34, 3.2)), P(at(11, 40, 3.2))], [P(at(33, 22, 3.2)), P(at(37, 29, 3.2))]], outline=False)
    # side rails and the top cap
    for a in (-3, Wd):
        s.add(*rslab(at(a, 0, -2.5), EX, EN, Z_, 3, 6, H, r=0.8, shade=0.5, rng=rng))
    s.add(*rslab(at(-4, H - 2, -3.5), EX, EN, Z_, Wd + 8, 8, 4, r=1.5, shade=0.25, rng=rng))
    return s


# ── Sprite Room: the laptop ──────────────────────────────────────────────────
# An open laptop; hanging from the notch on its screen, the app's pixel room,
# its characters at work.

CHARACTER = [
    "..++++..",
    "..++++..",
    "..++++..",
    "...++...",
    ".######.",
    "#.####.#",
    "#.####.#",
    "..####..",
    "..++++..",
    "..+..+..",
    "..+..+..",
    ".++..++.",
]
CHARACTER_REACH = [
    "......#",
    "..++++#",
    "..++++#",
    "..++++#",
    "...++.#",
    ".######",
    "#.####.",
    "#.####.",
    "..####.",
    "..++++.",
    "..+..+.",
    "..+..+.",
    ".++..++",
]
DESK = [
    ".######.",
    ".#++++#.",
    ".#++++#.",
    ".######.",
    "...##...",
    "++++++++++",
    "+........+",
    "+........+",
]
SHELF = [
    "#.##.+#.#",
    "#.##.+#.#",
    "+++++++++",
]


def spriteRoom():
    s = Scene(mirror=True, seed=9, bold=0.45)
    rng = s.rng
    D, Wd, T = 34, 52, 2.2  # base depth (x), width (y), thickness

    # the lid, tilted back about 12 degrees, drawn first (it's behind the base's keys)
    tilt = math.radians(12)
    up = (-math.sin(tilt), 0, math.cos(tilt))
    nrm = (math.cos(tilt), 0, math.sin(tilt))
    LH = 35
    lo = add((-0.6, 0, T + 0.3), mul(nrm, -0.9))
    s.add(*rslab(lo, Y_, up, nrm, Wd, LH, 0.9, r=2.2, shade=0.3, rng=rng))
    face = add(lo, mul(nrm, 0.91))
    lines = [rrect_on(face, Y_, up, Wd / 2, LH / 2 + 0.4, Wd - 3, LH - 3.4, 1.2)]
    # notch, inked in
    notch = rounded_rect(Wd / 2, LH - 2.2, 8, 2.4, 0.6)
    npoly = Polygon(plane_pts(face, Y_, up, notch))
    lines.append(list(npoly.exterior.coords))
    lines += hatch(npoly.buffer(-0.05), 60, 0.28)
    # the room, dropped from the notch: a panel with a pixel floor and sprites
    PW, PH = 26, 16
    px0, py1 = Wd / 2 - PW / 2, LH - 3.4
    lines.append(rrect_on(face, Y_, up, Wd / 2, py1 - PH / 2, PW, PH, 1.0))
    floor_y = py1 - PH + 1.2
    for i in range(1, 13):
        y0 = px0 + 1 + (PW - 2) * i / 13
        lines.append(plane_pts(face, Y_, up, [(y0, floor_y), (y0, floor_y + 3)]))
    lines.append(plane_pts(face, Y_, up, [(px0 + 1, floor_y + 3), (px0 + PW - 1, floor_y + 3)]))
    lines.append(plane_pts(face, Y_, up, [(px0 + 1, floor_y + 1.5), (px0 + PW - 1, floor_y + 1.5)]))
    s.add(lines, outline=False)
    u = 0.62
    f2 = add(face, mul(nrm, 0.02))
    s.add(*sprite(SHELF, add(f2, add(mul(Y_, px0 + 2.2), mul(up, py1 - 5.5))), Y_, up, u), outline=False)
    s.add(*sprite(DESK, add(f2, add(mul(Y_, px0 + 2.0), mul(up, floor_y + 3))), Y_, up, u), outline=False)
    s.add(*sprite(CHARACTER, add(f2, add(mul(Y_, px0 + 10), mul(up, floor_y + 3))), Y_, up, u), outline=False)
    s.add(*sprite(CHARACTER_REACH, add(f2, add(mul(Y_, px0 + 17.5), mul(up, floor_y + 3))), Y_, up, u), outline=False)
    s.add(*sprite(DESK, add(f2, add(mul(Y_, px0 + 19), mul(up, floor_y + 3))), Y_, up, u * 0.8), outline=False)
    # a line of "screen" below the room: the editor it floats over, dimmed to dashes
    s.add(dash_rows(face, Y_, up, 4, py1 - PH - 2.5, 20, 7, 1.7, rng, unit=1.3), outline=False)

    # hinge
    s.add(*contour_cylinder((-0.2, 3, T), (-0.2, Wd - 3, T), 1.1, rings=0, bands=(0.02, 0.98), shade=0.2, rng=rng))
    # the base, its keyboard and trackpad
    s.add(*rbox((0, 0, 0), (D, Wd, T), r=2.4, shade=0.6, rng=rng))
    top = T + 0.01
    keys = []
    kw, kd = 3.2, 3.1
    for row in range(6):
        x = 3.5 + row * 3.6
        n = 13 if row else 14
        for i in range(n):
            y = 4 + i * (Wd - 8) / n
            w = (Wd - 8) / n - 0.5
            if row == 5 and 3 <= i <= 9:
                if i == 3:
                    keys.append(plane_pts((x, 0, top), X_, Y_, rounded_rect(kd / 2, y + w * 3.5 + 0.25 * 7, kd, w * 7 + 0.5 * 6, 0.4, 3)))
                continue
            pts = rounded_rect(kd / 2, y + w / 2, kd if row else kd * 0.7, w, 0.4, 3)
            keys.append(plane_pts((x, 0, top), X_, Y_, pts + pts[:1]))
    keys.append(rrect_on((0, 0, top), X_, Y_, 3.2 + 3.6 * 3, Wd / 2, 3.6 * 6 + 0.6, Wd - 5.4, 1.2))
    keys.append(rrect_on((0, 0, top), X_, Y_, D - 5.5, Wd / 2, 7.2, 17, 1.0))
    s.add(keys, outline=False)
    # ports on the near side
    s.add([rrect_on((0, Wd + 0.01, 0), X_, Z_, x, T / 2, 2.2, 0.8, 0.35) for x in (6, 9.5)], outline=False)
    return s


# ── GPT From Scratch: the typewriter ─────────────────────────────────────────
# A manual typewriter with its casing off: the basket of typebars with one
# mid-strike, the keys, the platen, and a sheet whose last line is still being
# written, one character at a time.


def gptScratch():
    s = Scene(mirror=True, seed=4, bold=0.45)
    rng = s.rng
    D, Wd = 34, 46

    # the paper, rising behind the platen (drawn first: everything is in front of it)
    PX, PZ, PR = 5, 19, 3.2
    lean = norm((-0.28, 0, 1))
    so = (PX - 0.4, 10, PZ + PR - 0.5)
    SW, SH = Wd - 20, 25
    sheet = plane_pts(so, Y_, lean, [(0, 0), (SW, 0), (SW, SH - 2)]) + [P(add(so, add(mul(Y_, SW - 3), mul(lean, SH))))] + plane_pts(so, Y_, lean, [(0, SH), (0, 0)])
    rows = dash_rows(so, Y_, lean, 2.5, SH - 3.5, SW - 5, 10, 1.9, rng, unit=1.35, last_partial=True)
    s.add(rows + [sheet], Polygon(sheet))

    # ribbon spools on their posts, the carriage rail behind the platen
    s.add(*rbox((-2, -3, 13), (5, Wd + 6, 3), r=1.2, shade=0.5, rng=rng))
    for y in (9, Wd - 9):
        s.add(*contour_cylinder((10, y, 14), (10, y, 16), 3.2, rings=0, bands=(0.5,), shade=0, rng=rng))
    s.add([[P((10, 9 + 3, 15.2)), P((12, Wd / 2 - 3, 15.4)), P((12, Wd / 2 + 3, 15.4)), P((10, Wd - 12, 15.2))]], outline=False)
    # the platen and its knobs
    s.add(*contour_cylinder((PX, -1, PZ), (PX, Wd + 1, PZ), PR, rings=0, bands=(0.06, 0.94), shade=0.5, rng=rng))
    for y0, y1 in [(-5, -1), (Wd + 1, Wd + 5)]:
        s.add(*contour_cylinder((PX, y0, PZ), (PX, y1, PZ), 2.6, rings=5, shade=0.3, rng=rng))
    # carriage return lever
    s.add(*tube([(PX, -3, PZ + 2.6), (PX + 3, -5, PZ + 5), (PX + 9, -7, PZ + 6)], 0.5))

    # side frames and base
    for y in (0, Wd - 2.5):
        s.add(*rbox((3, y, 3), (D - 10, 2.5, 11), r=1.2, shade=0.6, rng=rng))
    s.add(*rbox((0, -1, 0), (D, Wd + 2, 3), r=2.5, shade=0.6, rng=rng))

    # the basket of typebars fanning to the printing point, one raised
    bc = (12, Wd / 2, 9.5)
    strike = (PX + PR + 0.4, Wd / 2, PZ - 0.5)
    bars, heavy = [], []
    for k in range(29):
        t = math.pi * (0.08 + 0.84 * k / 28)
        o = add(bc, (math.sin(t) * 9.5, -math.cos(t) * 9.5 * 1.35, 0))
        tip = add(bc, (math.sin(t) * 3.2 - 1.5, -math.cos(t) * 3.2, 1.2))
        if k == 14:
            bars.append([P(o), P(strike)])
            heavy.append([P(o), P(strike)])
        else:
            bars.append([P(o), P(tip)])
    arc = [P(add(bc, (math.sin(t) * 10.2, -math.cos(t) * 10.2 * 1.35, -0.4))) for t in [math.pi * i / 40 for i in range(41)]]
    bars.append(arc)
    s.add(bars, heavy=heavy + [arc])

    # four stepped rows of round keys on their stems, and the space bar
    for row in range(4):
        x = D - 5 - row * 4.2
        z = 5.5 + row * 1.8
        n = 11 - (row == 0)
        for i in range(n):
            y = 4.5 + (i + (0.5 if row % 2 else 0) + (0.5 if row == 0 else 0)) * (Wd - 9) / 11
            s.add([[P((x, y, 3)), P((x, y, z))]], outline=False)
            s.add(*contour_cylinder((x, y, z), (x, y, z + 0.7), 1.4, rings=0, shade=0, rng=rng))
    s.add(*rbox((D - 1.5, 13, 4.2), (2, Wd - 26, 1), r=0.5, shade=0, rng=rng))
    return s


# ── Capacitor Matching Network: the board ────────────────────────────────────
# The RF board the solver designs for: signal in and out on SMA connectors,
# four radial capacitors matched and placed symmetrically on a diamond bridge.


def capMatch():
    s = Scene(mirror=False, seed=3, bold=0.45)
    rng = s.rng
    D, Wd, T = 34, 54, 1.6
    top = T + 0.01
    cx, cy = D / 2, Wd / 2

    # the far SMA connector (behind the board edge)
    def sma(y0, dirn):
        body = (cx, y0, T / 2 + 2.2)
        s.add(*rbox((cx - 3, y0 - (3 if dirn < 0 else 0), -1.8), (6, 3, 7.5), r=0.5, shade=0.5, rng=rng))
        c1 = add(body, (0, dirn * 3, 0))
        s.add(*contour_cylinder(add(body, (0, dirn * 3, 0)), add(body, (0, dirn * 9, 0)), 2.1, rings=8, shade=0.4, rng=rng))
        s.add(*contour_cylinder(add(body, (0, dirn * 9, 0)), add(body, (0, dirn * 11, 0)), 1.4, rings=0, shade=0, rng=rng))
        s.add([circle3(add(body, (0, dirn * 11.01, 0)), X_, Z_, 0.35, 16)], outline=False)

    sma(0, -1)
    s.add(*rbox((0, 0, 0), (D, Wd, T), r=1.8, shade=0.7, rng=rng))
    # copper pour edge, stitching vias, mounting holes
    ln = [rrect_on((0, 0, top), X_, Y_, cx, cy, D - 3, Wd - 3, 1.2)]
    for i in range(1, 18):
        for x in (2.6, D - 2.6):
            ln.append(circle3((x, 1.5 + i * (Wd - 3) / 18, top), X_, Y_, 0.3, 12))
    for x in (3.4, D - 3.4):
        for y in (3.4, Wd - 3.4):
            ln.append(circle3((x, y, top), X_, Y_, 1.3, 30))
            ln.append(circle3((x, y, top), X_, Y_, 0.8, 30))
    # the bridge: four nodes in a diamond, feed lines to the connectors
    N, E, S_, W = (cx - 11, cy), (cx, cy + 12), (cx + 11, cy), (cx, cy - 12)
    def strip(a, b, w=0.7):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        nx, ny = -dy / L * w, dx / L * w
        return [plane_pts((0, 0, top), X_, Y_, [(a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny)]),
                plane_pts((0, 0, top), X_, Y_, [(a[0] - nx, a[1] - ny), (b[0] - nx, b[1] - ny)])]
    ln += strip((cx, 0), W) + strip(E, (cx, Wd))
    pads = []
    for a, b in [(W, N), (N, E), (E, S_), (S_, W)]:
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        d = (b[0] - a[0], b[1] - a[1])
        L = math.hypot(*d)
        ux, uy = d[0] / L, d[1] / L
        p1 = (m[0], m[1] - 1.6)
        p2 = (m[0], m[1] + 1.6)
        ln += strip(a, (m[0] - ux * 2.4, m[1] - uy * 2.4), 0.55) + strip((m[0] + ux * 2.4, m[1] + uy * 2.4), b, 0.55)
        for p in (p1, p2):
            ln.append(circle3((p[0], p[1], top), X_, Y_, 0.75, 20))
        pads.append((m, (ux, uy), p1, p2))
    for node in (N, E, S_, W):
        ln.append(circle3((node[0], node[1], top), X_, Y_, 1.1, 24))
    # ground vias at the two unused bridge corners
    for node in (N, S_):
        ln.append(circle3((node[0], node[1], top), X_, Y_, 0.45, 16))
    s.add(ln, outline=False)
    # the capacitors: matched discs on two leads, back to front
    for m, (ux, uy), p1, p2 in sorted(pads, key=lambda q: q[0][0] + q[0][1]):
        h = 5.2
        s.add([[P((p1[0], p1[1], top)), P((p1[0], p1[1], h - 1))], [P((p2[0], p2[1], top)), P((p2[0], p2[1], h - 1))]], outline=False)
        c = (m[0], m[1], h + 2.6)
        s.add(*contour_cylinder(add(c, (-0.5, 0, 0)), add(c, (0.5, 0, 0)), 2.9, rings=0, shade=0.4, rng=rng))
    sma(Wd, 1)
    return s


# ── smallsh: the terminal ────────────────────────────────────────────────────
# A VT100-style terminal and its keyboard on a coiled cable: the shell's prompt
# on the screen, a job in the background, the cursor waiting.


def smallsh():
    s = Scene(mirror=True, seed=2, bold=0.45)
    rng = s.rng
    Wd = 36

    # rear housing, tapered, with vents
    s.add(*rbox((0, 4, 12), (15, Wd - 8, 20), r=2.5, shade=0.5, rng=rng))
    s.add([[P((2 + i * 1.6, 8, 32.01)), P((2 + i * 1.6, Wd - 8, 32.01))] for i in range(7)], outline=False)
    # plinth and front bezel
    s.add(*rbox((6, 6, 0), (14, Wd - 12, 9), r=2, shade=0.6, rng=rng))
    s.add(*rbox((13, 0, 8), (7, Wd, 29), r=2.8, shade=0.15, rng=rng))
    face = (20.01, 0, 0)
    ln = [rrect_on(face, Y_, Z_, Wd / 2, 23, Wd - 5, 22, 2.8), rrect_on(face, Y_, Z_, Wd / 2, 23, Wd - 7.5, 19.5, 2.2)]
    # the screen: prompts (a chevron, then code), a background job, the cursor
    for r in range(7):
        y = 30.5 - r * 2.3
        ln.append(plane_pts(face, Y_, Z_, [(5, y + 0.45), (5.9, y), (5, y - 0.45)]))
        x = 7.2
        end = 7.2 + rng.uniform(8, 20) if r < 6 else 9
        while x < end:
            w = rng.uniform(0.8, 2.8)
            ln.append(plane_pts(face, Y_, Z_, [(x, y), (min(x + w, end), y)]))
            x += w + 0.7
        if r == 2:
            ln.append(plane_pts(face, Y_, Z_, [(end + 1.2, y + 0.5), (end + 1.2, y - 0.5)]))  # trailing &-ish mark
    cur = Polygon(plane_pts(face, Y_, Z_, [(10, 16.5), (11.2, 16.5), (11.2, 15.1), (10, 15.1)]))
    ln.append(list(cur.exterior.coords))
    ln += hatch(cur, 60, 0.25)
    # brightness knob and a badge plate under the screen
    ln.append(rrect_on(face, Y_, Z_, Wd / 2, 10.3, 8, 1.4, 0.4))
    s.add(ln, outline=False)
    s.add(*contour_cylinder((20, Wd - 4, 10.4), (21.2, Wd - 4, 10.4), 1, rings=0, shade=0, rng=rng))

    # the coiled cable from the terminal to the keyboard
    coil = []
    a, b = (18, Wd - 6, 1.2), (27, Wd - 6, 1.2)
    for i in range(241):
        t = i / 240
        ang = t * 2 * math.pi * 9
        p = lerp3(a, b, t)
        coil.append(P((p[0], p[1] + 0.8 * math.cos(ang), p[2] + 0.8 * math.sin(ang))))
    s.add([], heavy=[coil])

    # keyboard: a slab with rows of keys
    KX, KD = 27, 15
    s.add(*rbox((KX, -2, 0), (KD, Wd + 4, 3), r=1.5, shade=0.6, rng=rng))
    keys = []
    for row in range(5):
        x = KX + 1.8 + row * 2.6
        for i in range(15):
            y = 0 + i * (Wd / 15)
            if row == 4 and 4 <= i <= 10:
                if i == 4:
                    pts = rounded_rect(x + 1, y + 7 * Wd / 30, 2.1, 7 * Wd / 15 - 0.6, 0.35, 3)
                    keys.append(plane_pts((0, 0, 3.01), X_, Y_, pts + pts[:1]))
                continue
            pts = rounded_rect(x + 1, y + Wd / 30, 2.1, Wd / 15 - 0.6, 0.35, 3)
            keys.append(plane_pts((0, 0, 3.01), X_, Y_, pts + pts[:1]))
    s.add(keys, outline=False)
    return s


def lerp3(a, b, t):
    return tuple(i + (j - i) * t for i, j in zip(a, b))


# ── AccliMate: the microscope ────────────────────────────────────────────────
# A microscope over a glass slide of code. Under the objective, three lines of
# it are bracketed: the exact lines an answer cites.


def acclimate():
    s = Scene(mirror=False, seed=5, bold=0.45)
    rng = s.rng

    # base and pillar
    s.add(*rbox((0, 0, 0), (30, 24, 4), r=4, shade=0.6, rng=rng))
    s.add(*rbox((1.5, 8, 4), (7, 8, 11), r=1.5, shade=0.6, rng=rng))
    # focus knobs, far side
    s.add(*contour_cylinder((5, 8, 22), (5, 5, 22), 3.2, rings=6, shade=0.3, rng=rng))
    # the arm: a curved casting from the pillar up and over the stage
    s.add(*tube([(5, 12, 14), (3.5, 12, 26), (4, 12, 38), (9, 12, 46), (15, 12, 47)], 2.8, shading=False))
    # illuminator under the stage
    s.add(*contour_cylinder((17, 12, 4), (17, 12, 9), 2.4, rings=0, bands=(0.8,), shade=0.3, rng=rng))
    # stage with its aperture and clips
    s.add(*rbox((8, 1, 17.5), (21, 22, 2), r=1.5, shade=0.6, rng=rng))
    st = 19.51
    s.add([circle3((17, 12, st), X_, Y_, 2.6, 40)], outline=False)
    # the slide: glass, with rows of code along it
    s.add(*rbox((13, 1.5, st), (8, 21, 0.4), r=0.3, shade=0, rng=rng))
    sl = (13, 1.5, st + 0.41)
    rows = []
    for r in range(7):
        x = 14 + r * 0.95
        ind = [0, 1, 1, 2, 2, 1, 0][r] * 1.2
        y = 3 + ind
        end = 20 - rng.uniform(0, 5)
        while y < end:
            w = rng.uniform(0.8, 2.4)
            rows.append([P((x, y, sl[2])), P((x, min(y + w, end), sl[2]))])
            y += w + 0.55
    # a box around three rows under the objective: the lines an answer cites
    br = [P((15.5, 5.2, sl[2])), P((18.35, 5.2, sl[2])), P((18.35, 14, sl[2])), P((15.5, 14, sl[2])), P((15.5, 5.2, sl[2]))]
    s.add(rows, outline=False, heavy=[br])
    for y in (3, 21):
        s.add(*rbox((11, y - 0.6, st + 0.4), (7, 1.2, 0.5), r=0.4, shade=0, rng=rng))
        s.add(*contour_cylinder((11, y, st + 0.9), (11, y, st + 1.7), 0.9, rings=0, shade=0, rng=rng))
    # nosepiece turret and objectives, the working one pointing at the slide
    s.add(*contour_cylinder((17, 12, 29), (17, 12, 32), 4, rings=0, bands=(0.5,), shade=0.4, rng=rng))
    s.add(*contour_cylinder((14.5, 10, 29), (13.2, 8.5, 25), 1.2, rings=0, bands=(0.4,), shade=0.3, rng=rng))
    s.add(*contour_cylinder((17, 12, 29), (17, 12, 22.5), 1.35, rings=0, bands=(0.3, 0.7), shade=0.3, rng=rng))
    s.add(*contour_cylinder((19.5, 14, 29), (20.8, 15.5, 25), 1.2, rings=0, bands=(0.4,), shade=0.3, rng=rng))
    # body tube and the eyepiece angled back toward the viewer's eye
    s.add(*contour_cylinder((17, 12, 32), (17, 12, 45), 2.6, rings=0, bands=(0.15, 0.85), shade=0.5, rng=rng))
    s.add(*contour_cylinder((17, 12, 45), (13, 12, 53), 2.0, rings=0, bands=(0.5,), shade=0.4, rng=rng))
    s.add(*contour_cylinder((13, 12, 53), (12.2, 12, 54.6), 2.5, rings=2, shade=0, rng=rng))
    # focus knobs, near side
    s.add(*contour_cylinder((5, 16, 22), (5, 19.5, 22), 3.2, rings=6, shade=0.3, rng=rng))
    s.add(*contour_cylinder((5, 19.5, 22), (5, 21.5, 22), 1.9, rings=3, shade=0.2, rng=rng))
    return s


SCENES = {
    "acclimate": acclimate,
    "spriteRoom": spriteRoom,
    "monteCarlo": monteCarlo,
    "gptScratch": gptScratch,
    "capMatch": capMatch,
    "smallsh": smallsh,
}

if __name__ == "__main__":
    names = list(SCENES) if "--all" in sys.argv else sys.argv[1:]
    for name in names:
        SCENES[name]().svg(OUT / f"{name}.svg")
        print(f"wrote svgs/svg_data/{name}.svg")
