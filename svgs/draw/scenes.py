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

from shapely.geometry import LineString, MultiPoint, Polygon

sys.path.insert(0, str(Path(__file__).resolve().parent))
from iso import (P, Scene, add, box, circle3, contour_cylinder, cylinder, dashed, disc, hatch, knurl, mul, norm,  # noqa: E402
                 plane_pts, rbox, rounded_rect, rslab, screw, section, sphere, sprite, sub, tube)

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
    # the cutaway: the near corner of the deck removed down to the logic board
    cut2d = [(D - 1.2, Wd * 0.52), (15, Wd * 0.52), (15, Wd - 1.2), (D - 1.2, Wd - 1.2)]
    cut = Polygon([P((x, y, top)) for x, y in cut2d])
    inner = []
    lo_z = 0.7
    board = [(17, Wd * 0.55), (D - 3, Wd * 0.55), (D - 3, Wd - 3), (17, Wd - 3)]
    inner.append([P((x, y, lo_z)) for x, y in board + board[:1]])
    for (x, y, w, d) in [(19, Wd * 0.58, 5, 5), (26, Wd * 0.58, 3, 2.2), (26, Wd * 0.58 + 3, 3, 2.2)]:
        inner.append([P((x + a, y + b, lo_z + 0.5)) for a, b in [(0, 0), (w, 0), (w, d), (0, d), (0, 0)]])
        inner.append([P((x + a, y + b, lo_z)) for a, b in [(w, 0), (w, d), (0, d)]])
    fc = (22, Wd - 8)
    inner.append(circle3((fc[0], fc[1], lo_z + 0.3), X_, Y_, 3.4, 40))
    inner.append(circle3((fc[0], fc[1], lo_z + 0.3), X_, Y_, 1.0, 20))
    for k in range(9):
        t = 2 * math.pi * k / 9
        inner.append([P((fc[0] + 1.0 * math.cos(t), fc[1] + 1.0 * math.sin(t), lo_z + 0.3)),
                      P((fc[0] + 3.2 * math.cos(t + 0.5), fc[1] + 3.2 * math.sin(t + 0.5), lo_z + 0.3))])
    for k in range(3):
        y0 = Wd * 0.55 + k * 4.4
        inner.append([P((x, y, lo_z)) for x, y in [(D - 9, y0 + 0.3), (D - 3.5, y0 + 0.3), (D - 3.5, y0 + 4), (D - 9, y0 + 4), (D - 9, y0 + 0.3)]])
    # the cut's inner walls: its far edges dropping down to the board
    c0, c1, c2 = cut2d[0], cut2d[1], cut2d[2]
    inner += [[P((c1[0], c1[1], top)), P((c1[0], c1[1], lo_z))],
              [P((c0[0], c0[1], lo_z)), P((c1[0], c1[1], lo_z)), P((c2[0], c2[1], lo_z))]]
    for f in (0.3, 0.6):
        inner.append([P(lerp3((c0[0], c0[1], top), (c1[0], c1[1], top), f)), P(lerp3((c0[0], c0[1], lo_z), (c1[0], c1[1], lo_z), f))])
    clipped = []
    for ln in inner:
        g = LineString(ln).intersection(cut.buffer(-0.5))
        for part in getattr(g, "geoms", [g]):
            if part.geom_type == "LineString" and part.length > 0.2:
                clipped.append(list(part.coords))
    ring = cut.difference(cut.buffer(-0.55))
    s.add(clipped + section(ring.buffer(0), 0.3) if ring.geom_type == "Polygon" else clipped, outline=False,
          heavy=[list(cut.exterior.coords)])

    keys = []
    kw, kd = 3.2, 3.1
    for row in range(6):
        x = 3.5 + row * 3.6
        n = 13 if row else 14
        for i in range(n):
            y = 4 + i * (Wd - 8) / n
            w = (Wd - 8) / n - 0.5
            if x + kd > 15 and y + w > Wd * 0.52:
                continue  # inside the cutaway
            if row == 5 and 3 <= i <= 9:
                if i == 3:
                    keys.append(plane_pts((x, 0, top), X_, Y_, rounded_rect(kd / 2, y + w * 3.5 + 0.25 * 7, kd, w * 7 + 0.5 * 6, 0.4, 3)))
                continue
            pts = rounded_rect(kd / 2, y + w / 2, kd if row else kd * 0.7, w, 0.4, 3)
            keys.append(plane_pts((x, 0, top), X_, Y_, pts + pts[:1]))
    well = Polygon(rrect_on((0, 0, top), X_, Y_, 3.2 + 3.6 * 3, Wd / 2, 3.6 * 6 + 0.6, Wd - 5.4, 1.2))
    pad = Polygon(rrect_on((0, 0, top), X_, Y_, D - 5.5, Wd / 2 - 7, 7.2, 13, 1.0))
    for g in (well, pad):
        g = g.exterior.difference(cut.buffer(0.2))
        keys += [list(q.coords) for q in getattr(g, "geoms", [g])]
    s.add(keys, outline=False)
    # ports on the near side
    s.add([rrect_on((0, Wd + 0.01, 0), X_, Z_, x, T / 2, 2.2, 0.8, 0.35) for x in (6, 9.5)], outline=False)
    return s


# ── Capacitor Matching Network: the tuner ────────────────────────────────────
# An open RF tuner chassis: four air-variable capacitors, identical and set
# symmetrically, strapped into a bridge between the input and output
# connectors. Their meshed plates are the discrete, real parts the solver picks.


def air_cap(s, o, rotor_angle=0.9, plates=7, r=4.2, L=9.0):
    """An air-variable capacitor along +x from o: ceramic end frames, stator
    plates fixed in the upper half, rotor plates on the shaft swung partway in."""
    x0, y, z0 = o
    zc = z0 + r + 1.6
    # far end frame
    s.add(*rslab((x0, y - r - 1.2, z0), Y_, Z_, X_, 2 * r + 2.4, 2 * r + 3.4, 0.9, r=0.8, shade=0.2, rng=s.rng))
    # rails along the bottom and the shaft
    for dy in (-r - 0.6, r + 0.6):
        s.add(*contour_cylinder((x0 + 0.9, y + dy, z0 + 1), (x0 + L, y + dy, z0 + 1), 0.45, rings=0, shade=0, rng=s.rng))
    s.add(*contour_cylinder((x0 - 1.5, y, zc), (x0 + L + 4, y, zc), 0.45, rings=0, shade=0, rng=s.rng))
    # plates, far to near: stators (upper half) and rotors (swung in) alternating
    for i in range(plates * 2):
        x = x0 + 1.6 + i * (L - 2.2) / (plates * 2)
        c = (x, y, zc)
        if i % 2 == 0:
            lines, occ = disc(c, Y_, Z_, r, r * 0.22, 0.15, math.pi - 0.15, 40)
        else:
            a0 = math.pi + rotor_angle
            lines, occ = disc(c, Y_, Z_, r * 0.93, 0.0, a0, a0 + math.pi, 40)
        s.add(lines, occ)
    # near end frame, the shaft coupling and a pointer knob
    s.add(*rslab((x0 + L, y - r - 1.2, z0), Y_, Z_, X_, 2 * r + 2.4, 2 * r + 3.4, 0.9, r=0.8, shade=0.2, rng=s.rng))
    s.add(*contour_cylinder((x0 + L + 0.9, y, zc), (x0 + L + 2.2, y, zc), 1.1, rings=0, bands=(0.5,), shade=0, rng=s.rng))
    s.add(*contour_cylinder((x0 + L + 2.4, y, zc), (x0 + L + 4.2, y, zc), 2.2, rings=0, shade=0.3, rng=s.rng))
    kc = (x0 + L + 4.21, y, zc)
    s.add(knurl((x0 + L + 2.4, y, zc), (x0 + L + 4.2, y, zc), 2.2, 30) + [[P(kc), P(add(kc, (0, 1.9 * math.cos(rotor_angle), 1.9 * math.sin(rotor_angle))))]], outline=False)
    return (x0 + L / 2, y, z0 + 2 * r + 3.4)  # the top terminal


def capMatch():
    s = Scene(mirror=False, seed=3, bold=0.45)
    rng = s.rng
    D, Wd = 44, 48

    # chassis: floor, the tall back panel with the connectors, low far side
    s.add(*rbox((0, 0, 0), (D, Wd, 1.6), r=1.5, shade=0.5, rng=rng))
    s.add(*rbox((0, 0, 1.6), (1.6, Wd, 18), r=0.6, shade=0, rng=rng))
    s.add(*rbox((0, 0, 1.6), (D, 1.6, 4), r=0.6, shade=0, rng=rng))
    # N connectors through the back panel, in and out
    ports = []
    for y in (12, Wd - 12):
        c = (1.61, y, 13)
        s.add(*rbox((1.6, y - 2.6, 10.4), (0.8, 5.2, 5.2), r=0.4, shade=0, rng=rng))
        s.add(screw((2.41, y - 1.8, 11.2), Y_, Z_, 0.35, slot=False) + screw((2.41, y + 1.8, 14.8), Y_, Z_, 0.35, slot=False), outline=False)
        s.add(*contour_cylinder((2.4, y, 13), (5.2, y, 13), 1.6, rings=3, shade=0.3, rng=rng))
        ports.append((5.3, y, 13))
    # four matched capacitors, set symmetrically in a square
    tops = []
    for x0, y in [(10, 14), (10, Wd - 14), (25, 14), (25, Wd - 14)]:
        tops.append(air_cap(s, (x0, y, 1.6), rotor_angle=0.9))
    # the bridge: copper straps joining the capacitors' terminals, fed from the ports
    straps = []
    f, n_ = tops[0], tops[1]
    for a, b in [(tops[0], tops[1]), (tops[2], tops[3]), (tops[0], tops[2]), (tops[1], tops[3])]:
        straps.append([P(a), P(b)])
        straps.append([P(add(a, (0.6, 0, 0))), P(add(b, (0.6, 0, 0)))])
    for p, t in zip(ports, (tops[0], tops[1])):
        straps.append([P(p), P(add(p, (2, 0, 3))), P(t)])
    s.add(straps, outline=False, heavy=[[P(a), P(b)] for a, b in [(tops[0], tops[1]), (tops[2], tops[3]), (tops[0], tops[2]), (tops[1], tops[3])]])
    # the near sides, cut low, their cut edges hatched
    s.add(*rbox((D - 1.6, 0, 1.6), (1.6, Wd, 3), r=0.6, shade=0.4, rng=rng))
    s.add(*rbox((0, Wd - 1.6, 1.6), (D, 1.6, 3), r=0.6, shade=0.4, rng=rng))
    return s


# ── smallsh: the Teletype ────────────────────────────────────────────────────
# A Teletype ASR-33 on its stand, the terminal Unix grew up on: prompts typed
# out on the paper, a job sent to the background, and paper tape punched out
# its side.


def smallsh():
    s = Scene(mirror=True, seed=2, bold=0.45)
    rng = s.rng
    Wd = 40

    # the pedestal stand, with its shelf
    s.add(*rbox((4, 6, 0), (20, Wd - 12, 2), r=1, shade=0.4, rng=rng))
    for y in (7, Wd - 9):
        s.add(*rbox((6, y, 2), (16, 2, 26), r=0.8, shade=0.5, rng=rng))
    s.add(*rbox((6, 7, 12), (16, Wd - 14, 1.2), r=0.6, shade=0.3, rng=rng))
    # paper roll behind the platen
    s.add(*contour_cylinder((4, 6, 48), (4, Wd - 6, 48), 4.5, rings=0, bands=(0.03, 0.97), shade=0.5, rng=rng))
    # the paper coming up behind the window, typed on
    lean = norm((-0.15, 0, 1))
    so = (9, 8, 44)
    SW, SH = Wd - 16, 18
    sheet = plane_pts(so, Y_, lean, [(0, 0), (SW, 0), (SW, SH), (0, SH), (0, 0)])
    rows = []
    for r in range(7):
        y = SH - 2.6 - r * 2.2
        rows.append(plane_pts(so, Y_, lean, [(1.5, y + 0.45), (2.3, y), (1.5, y - 0.45)]))
        x = 3.2
        end = 3.2 + (rng.uniform(5, SW - 7) if r < 6 else 2.5)
        while x < end:
            w = rng.uniform(0.7, 2.4)
            rows.append(plane_pts(so, Y_, lean, [(x, y), (min(x + w, end), y)]))
            x += w + 0.6
        if r == 3:
            rows.append(plane_pts(so, Y_, lean, [(end + 1, y + 0.5), (end + 1.6, y - 0.5)]))
    s.add(rows + [sheet], Polygon(sheet))
    # the main housing, its rounded hood and the clear window over the platen
    s.add(*rbox((0, 0, 28), (30, Wd, 14), r=3, shade=0.6, rng=rng))
    s.add(*rbox((3, 2, 42), (18, Wd - 4, 3), r=2.5, shade=0.3, rng=rng))
    win = [(8.5, 7, 45.01), (8.5, Wd - 7, 45.01), (16, Wd - 7, 45.01), (16, 7, 45.01)]
    s.add([[P(a), P(b)] for a, b in zip(win, win[1:] + win[:1])] + [[P((10, 9, 45.01)), P((12, 13, 45.01))], [P((10.5, 11, 45.01)), P((11.5, 13, 45.01))]], outline=False)
    # the keyboard: four stepped rows of round keys on the front deck
    s.add(*rbox((20, 2, 42), (10, Wd - 4, 0.8), r=1.5, shade=0.2, rng=rng))
    for row in range(4):
        x = 28.4 - row * 2.3
        z = 42.8 + row * 0.35
        n = 11 + (row == 1)
        for i in range(n):
            y = 5 + (i + (0.5 if row % 2 else 0)) * (Wd - 10) / 11.5
            s.add(*contour_cylinder((x, y, z), (x, y, z + 0.8), 0.95, rings=0, shade=0, rng=rng))
    # the paper tape punch on the near side, tape curling out of it
    s.add(*rbox((10, Wd, 30), (14, 5, 12), r=1.5, shade=0.5, rng=rng))
    tape = []
    for i in range(40):
        t = i / 39
        tape.append((24 + 10 * t, Wd + 2.5 + 3 * math.sin(t * 2.5), 38 - 18 * t * t))
    edge1 = [P(add(q, (0, -1.2, 0))) for q in tape]
    edge2 = [P(add(q, (0, 1.2, 0))) for q in tape]
    holes = []
    for i in range(2, 38, 2):
        for k in range(rng.randint(1, 4)):
            q = add(tape[i], (0, -0.8 + k * 0.55, 0))
            holes.append(circle3(q, X_, Y_, 0.18, 8))
    s.add([edge1, edge2] + holes, Polygon(edge1 + edge2[::-1]).buffer(0), outline=False)
    # the power knob and the base of the housing's front
    s.add(*contour_cylinder((30, Wd - 5, 33), (31.3, Wd - 5, 33), 1.5, rings=0, shade=0, rng=rng))
    return s


def lerp3(a, b, t):
    return tuple(i + (j - i) * t for i, j in zip(a, b))


def bez3(a, b, c, d, t):
    u = 1 - t
    return tuple(u ** 3 * p + 3 * u * u * t * q + 3 * u * t * t * r + t ** 3 * w for p, q, r, w in zip(a, b, c, d))


def prism(poly2d, z0, z1):
    """A flat part cut from plate: a 2D outline (x, y) extruded from z0 to z1."""
    top = [P((x, y, z1)) for x, y in poly2d]
    bot = [P((x, y, z0)) for x, y in poly2d]
    return [top + [top[0]]], MultiPoint(top + bot).convex_hull


# ── AccliMate: the hard drive ────────────────────────────────────────────────
# A drive with its lid off: platters, spindle, the actuator and its voice coil.
# The platter's tracks are drawn as data (dashed arcs), and the head sits over
# one exact track, marked: an answer cited to the exact lines behind it.


def acclimate():
    s = Scene(mirror=False, seed=5, bold=0.45)
    rng = s.rng
    D, Wd, H = 40, 58, 8  # depth (x), length (y), height

    # casting: floor and the two far walls
    s.add(*rbox((0, 0, 0), (D, Wd, 2), r=2.5, shade=0.5, rng=rng))
    s.add(*rbox((0, 0, 2), (2.2, Wd, H - 2), r=1, shade=0, rng=rng))
    s.add(*rbox((0, 0, 2), (D, 2.2, H - 2), r=1, shade=0, rng=rng))
    # voice coil magnet, bolted down, in the far corner
    s.add(*rbox((3, Wd - 17, 2), (13, 14, 3.4), r=3, shade=0.3, rng=rng))
    s.add(sum([screw((x, y, 5.41), X_, Y_, 0.7) for x, y in [(5.5, Wd - 15), (13.5, Wd - 5.5)]], []), outline=False)
    # the flex cable from the actuator to the connector on the far wall
    fc = [(3, Wd - 24, 2.4), (6, Wd - 26, 2.4), (9, Wd - 23, 2.4), (11, Wd - 21, 2.4)]
    s.add([[P(q) for q in fc], [P(add(q, (0, 1.6, 0))) for q in fc]], outline=False)

    # the breather filter and a boss on the floor
    s.add(*rbox((D - 9, 3.5, 2), (5, 2.2, 3), r=0.5, shade=0.3, rng=rng))
    s.add([circle3((5, 6, 2.01), X_, Y_, 1.2, 24), circle3((5, 6, 2.01), X_, Y_, 0.5, 16)], outline=False)

    # platters on the spindle
    C = (19.5, 21.5)
    R = 17.5
    s.add(*cylinder((C[0], C[1], 2.6), (C[0], C[1], 3.3), R, n=120))
    s.add(*cylinder((C[0], C[1], 4.0), (C[0], C[1], 4.7), R, n=120))
    top = 4.71
    # the tracks: dashed arcs of data
    tracks = []
    for k, r in enumerate([6.5 + 0.62 * i for i in range(17)]):
        if k == 9:
            continue  # the cited track is drawn on its own below
        a = start = rng.uniform(0, 2 * math.pi)
        while a < start + 2 * math.pi:
            w = rng.uniform(0.8, 3.5) / r  # a run of data, in radians
            tracks.append([P((C[0] + r * math.cos(a + w * i / 6), C[1] + r * math.sin(a + w * i / 6), top)) for i in range(7)])
            a += w + 1.2 / r
    s.add(tracks, outline=False)
    # spindle clamp and its screws
    s.add(*contour_cylinder((C[0], C[1], top), (C[0], C[1], top + 1.4), 4.6, rings=0, shade=0.2, rng=rng))
    s.add(*contour_cylinder((C[0], C[1], top + 1.4), (C[0], C[1], top + 2.0), 2.4, rings=0, shade=0, rng=rng))
    s.add(sum([screw((C[0] + 3.4 * math.cos(t), C[1] + 3.4 * math.sin(t), top + 1.41), X_, Y_, 0.45, slot=False) for t in [k * math.pi / 3 for k in range(6)]], []), outline=False)

    # the actuator: pivot, arm to the head over one track, the coil behind
    PV = (10.5, Wd - 19)
    Rh = 6.5 + 0.62 * 9
    ang = math.atan2(PV[1] - C[1], PV[0] - C[0]) - 0.62
    Hd = (C[0] + Rh * math.cos(ang), C[1] + Rh * math.sin(ang))
    # the cited track: bold, with end marks, under the head
    arc = lambda rr, a0, a1: [P((C[0] + rr * math.cos(ang + t), C[1] + rr * math.sin(ang + t), top + 0.01)) for t in [a0 + (a1 - a0) * i / 60 for i in range(61)]]
    # the rest of that track, plain, then the cited span doubled and bracketed
    rest = [arc(Rh, 1.12 + 0.3 * k, 1.12 + 0.3 * k + 0.2) for k in range(17)]
    ticks = [[P((C[0] + (Rh - 0.9) * math.cos(ang + t), C[1] + (Rh - 0.9) * math.sin(ang + t), top + 0.01)),
              P((C[0] + (Rh + 0.9) * math.cos(ang + t), C[1] + (Rh + 0.9) * math.sin(ang + t), top + 0.01))] for t in (-0.1, 1.0)]
    s.add(rest, outline=False, heavy=[arc(Rh - 0.22, -0.1, 1.0), arc(Rh + 0.22, -0.1, 1.0)] + ticks)
    s.add(*contour_cylinder((PV[0], PV[1], 2), (PV[0], PV[1], 6.4), 2.8, rings=0, bands=(0.5,), shade=0.4, rng=rng))
    dx, dy = Hd[0] - PV[0], Hd[1] - PV[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    arm = [(PV[0] - ux * 7 + nx * 4.5, PV[1] - uy * 7 + ny * 4.5), (PV[0] + nx * 3.2, PV[1] + ny * 3.2),
           (Hd[0] - ux * 1 + nx * 0.8, Hd[1] - uy * 1 + ny * 0.8), (Hd[0] + ux * 0.8, Hd[1] + uy * 0.8),
           (Hd[0] - ux * 1 - nx * 0.8, Hd[1] - uy * 1 - ny * 0.8), (PV[0] - nx * 3.2, PV[1] - ny * 3.2),
           (PV[0] - ux * 7 - nx * 4.5, PV[1] - uy * 7 - ny * 4.5)]
    lines, occ = prism(arm, 5.2, 5.9)
    # lightening holes and the coil's winding in the tail
    for f, w in ((0.35, 1.3), (0.6, 0.8)):
        cxh, cyh = PV[0] + dx * f, PV[1] + dy * f
        lines.append([P((cxh + ux * w * 1.6 * math.cos(t) + nx * w * math.sin(t), cyh + uy * w * 1.6 * math.cos(t) + ny * w * math.sin(t), 5.91)) for t in [2 * math.pi * i / 30 for i in range(31)]])
    for k in range(4):
        q = 0.6 + k * 0.5
        lines.append([P((PV[0] - ux * (7 - q) + nx * (4.5 - q * 0.9), PV[1] - uy * (7 - q) + ny * (4.5 - q * 0.9), 5.91)),
                      P((PV[0] - ux * (1.5 + q * 0.3) + nx * (3.0 - q * 0.5), PV[1] - uy * (1.5 + q * 0.3) + ny * (3.0 - q * 0.5), 5.91)),
                      P((PV[0] - ux * (1.5 + q * 0.3) - nx * (3.0 - q * 0.5), PV[1] - uy * (1.5 + q * 0.3) - ny * (3.0 - q * 0.5), 5.91)),
                      P((PV[0] - ux * (7 - q) - nx * (4.5 - q * 0.9), PV[1] - uy * (7 - q) - ny * (4.5 - q * 0.9), 5.91))])
    s.add(lines, occ)
    s.add(*contour_cylinder((PV[0], PV[1], 5.9), (PV[0], PV[1], 6.8), 1.5, rings=0, shade=0, rng=rng))
    s.add(screw((PV[0], PV[1], 6.81), X_, Y_, 0.8), outline=False)
    s.add(*box((Hd[0] - 0.6, Hd[1] - 0.6, 4.75), (1.2, 1.2, 0.45)))

    # the head-parking ramp, just past the platter's edge beside the head
    ra = math.atan2(PV[1] - C[1], PV[0] - C[0]) - 1.05
    rp = (C[0] + (R + 1.6) * math.cos(ra), C[1] + (R + 1.6) * math.sin(ra))
    s.add(*rbox((rp[0] - 1.1, rp[1] - 1.1, 2), (2.2, 2.2, 2.8), r=0.4, shade=0.3, rng=rng))

    # the near walls, and screw holes along the rim for the lid
    s.add(*rbox((D - 2.2, 0, 2), (2.2, Wd, H - 2), r=1, shade=0.5, rng=rng))
    s.add(*rbox((0, Wd - 2.2, 2), (D, 2.2, H - 2), r=1, shade=0.5, rng=rng))
    rim = []
    for x, y in [(1.1, 1.1), (D - 1.1, 1.1), (D - 1.1, Wd - 1.1), (1.1, Wd - 1.1), (1.1, Wd / 2), (D - 1.1, Wd / 2)]:
        rim += screw((x, y, H + 0.01), X_, Y_, 0.55, slot=False)
    s.add(rim, outline=False)
    return s


# ── GPT From Scratch: the rotor machine ──────────────────────────────────────
# An Enigma-style cipher machine, lid open: a key pressed at the front, the
# signal through four rotors (the model's four blocks), and one lamp lit on the
# lampboard: the next character, produced one at a time.


def gptScratch():
    s = Scene(mirror=True, seed=4, bold=0.45)
    rng = s.rng
    D, Wd, H = 34, 42, 12

    # the lid, open and leaning back on its hinges
    tilt = math.radians(14)
    up = (-math.sin(tilt), 0, math.cos(tilt))
    nrm = (math.cos(tilt), 0, math.sin(tilt))
    lo = add((-1.2, 0, H), mul(nrm, -1.4))
    s.add(*rslab(lo, Y_, up, nrm, Wd, 22, 1.4, r=1.2, shade=0.3, rng=rng))
    face = add(lo, mul(nrm, 1.41))
    s.add([rrect_on(face, Y_, up, Wd / 2, 11, Wd - 4, 18, 0.8)] +
          sum([screw(add(face, add(mul(Y_, y), mul(up, z))), Y_, up, 0.5) for y, z in [(3, 3), (Wd - 3, 3), (3, 19), (Wd - 3, 19)]], []), outline=False)

    # the case, with corner brackets
    s.add(*rbox((0, 0, 0), (D, Wd, H), r=1.4, shade=0.6, rng=rng))
    top = H + 0.01
    s.add([rrect_on((0, 0, top), X_, Y_, D / 2, Wd / 2, D - 2.4, Wd - 2.4, 0.8)], outline=False)

    # the rotor bay: four rotors, reflector and entry wheel on their spindle
    s.add(*rbox((2, 2, H), (10, Wd - 4, 0.6), r=0.8, shade=0, rng=rng))
    RX, RZ = 7, H + 4.2
    s.add(*contour_cylinder((RX, 3, RZ), (RX, Wd - 3, RZ), 0.5, rings=0, shade=0, rng=rng))
    wheels = [(5, 1.6, 3.6, "reflector")] + [(10.5 + i * 5.2, 3.0, 3.9, "rotor") for i in range(4)] + [(33, 2.0, 3.6, "entry")]
    for y, w, r, kind in wheels:
        s.add(*contour_cylinder((RX, y, RZ), (RX, y + w, RZ), r, rings=0, bands=(0.5,) if kind == "rotor" else (), shade=0.3, rng=rng))
        if kind == "rotor":
            # the alphabet ring's ticks and the knurled thumbwheel
            lines, occ = contour_cylinder((RX, y + w, RZ), (RX, y + w + 0.9, RZ), r + 0.5, rings=0, shade=0, rng=rng)
            s.add(lines + knurl((RX, y + w, RZ), (RX, y + w + 0.9, RZ), r + 0.5, 40), occ)
    # the window strip each rotor shows its letter through, as a small plate
    # keyboard: three staggered rows of round keys on stems
    rows = [(D - 3.2, 9), (D - 6.4, 8), (D - 9.6, 9)]
    for ri, (x, n) in enumerate(rows):
        z = top + 0.8 + ri * 0.2
        for i in range(n):
            y = 5.5 + (i + (0.5 if n == 8 else 0)) * (Wd - 11) / 8.6
            s.add([[P((x, y, top)), P((x, y, z))]], outline=False)
            pressed = ri == 1 and i == 3
            s.add(*contour_cylinder((x, y, z - (0.6 if pressed else 0)), (x, y, z + 0.6 - (0.6 if pressed else 0)), 1.25, rings=0, shade=0, rng=rng))
    # lampboard: three rows of lamp windows, one lit
    for ri, (x, n) in enumerate([(D - 13.2, 9), (D - 16.2, 8), (D - 19.2, 9)]):
        for i in range(n):
            y = 5.5 + (i + (0.5 if n == 8 else 0)) * (Wd - 11) / 8.6
            c = (x, y, top)
            lit = ri == 0 and i == 5
            lines = [circle3(c, X_, Y_, 1.15, 24), circle3(c, X_, Y_, 0.75, 20)]
            if lit:
                for k in range(12):
                    t = k * math.pi / 6
                    lines.append([P((x + 1.5 * math.cos(t), y + 1.5 * math.sin(t), top)), P((x + 2.6 * math.cos(t), y + 2.6 * math.sin(t), top))])
                poly = Polygon(circle3(c, X_, Y_, 0.75, 20))
                lines += hatch(poly, 30, 0.22)
            s.add(lines, outline=False, heavy=[circle3(c, X_, Y_, 1.15, 24)] if lit else [])

    # the plugboard on the front face, with a few patch cables
    fx = D + 0.01
    pb = []
    sockets = []
    for row in range(2):
        for i in range(13):
            y = 3.5 + i * (Wd - 7) / 12
            z = 3 + row * 4.2
            for dz in (0.6, -0.6):
                pb.append(circle3((fx, y, z + dz), Y_, Z_, 0.42, 14))
            sockets.append((fx, y, z))
    pb.append(rrect_on((fx, 0, 0), Y_, Z_, Wd / 2, 5.1, Wd - 3, 8.6, 0.6))
    s.add(pb, outline=False)
    for a, b in [(1, 15), (4, 20), (8, 22), (11, 16)]:
        pa, pb2 = sockets[a], sockets[b]
        mid = ((pa[0] + pb2[0]) / 2 + 5, (pa[1] + pb2[1]) / 2, min(pa[2], pb2[2]) - 5)
        path = [bez3(pa, add(pa, (6, 0, -2)), add(pb2, (6, 0, -2)), pb2, t / 30) for t in range(31)]
        path = [add(q, (0, 0, -6 * math.sin(math.pi * i / 30))) for i, q in enumerate(path)]
        s.add(*tube(path, 0.4, shading=False))
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
