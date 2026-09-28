"""The code-drawn line drawings, one function per spec in svgs/specs.

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
from iso import (P, Scene, mul, add, arrow, arrow_head, bezier, bolt_circle, box, circle3, contour_cylinder,  # noqa: E402
                 cylinder, dashed, flat, hatch, lerp, perp_frame, rbox, rounded_rect, sphere, sprite, stipple, tube)

OUT = Path(__file__).resolve().parent.parent / "svg_data"


def top_face_poly(o, w, d):
    x, y, z = o
    return Polygon([P((x, y, z)), P((x + w, y, z)), P((x + w, y + d, z)), P((x, y + d, z))])


# ── GPT From Scratch ─────────────────────────────────────────────────────────
# An exploded transformer block on guide rods: token tiles, embedding plate
# with the positional-encoding plate sliding in, attention heads with the
# causal mask hatched, a stippled norm plate, the feed-forward layer, residual
# pipes, and the single neuron it was all built up from at the base.


def gptScratch():
    s = Scene(mirror=True, seed=4)
    W, D = 46, 34
    Z_TOK, Z_EMB, Z_ATT, Z_NORM, Z_FF0, Z_FF1 = 0, 26, 58, 88, 108, 134

    # guide rods through the corners of the stack (engineering centre lines)
    for x, y in [(0, 0), (W, 0), (0, D), (W, D)]:
        a, b = P((x, y, Z_TOK - 6)), P((x, y, Z_FF1 + 10))
        s.add(dashed([a, b], dash=5, gap=1.6, dot_dash=True))

    # token tiles: subwords, two of them fused BPE pairs
    x = 1
    for w, fused in [(5, False), (9, True), (4, False), (7, False), (10, True), (6, False)]:
        o = (x, D / 2 - 3, Z_TOK)
        lines, occ = box(o, (w, 6, 3.2), shade={"+y": (90, 0.9)}, rng=s.rng)
        if fused:
            m = x + w / 2
            lines += [[P((m, o[1], o[2] + 3.2)), P((m, o[1] + 6, o[2] + 3.2))],
                      [P((m, o[1] + 6, o[2] + 3.2)), P((m, o[1] + 6, o[2]))]]
        s.add(lines, occ)
        x += w + 1.4

    # embedding plate: a grid of columns
    lines, occ = box((0, 0, Z_EMB), (W, D, 2.4), shade={"+x": (0, 1.3), "+y": (90, 2.2)}, rng=s.rng)
    top = Z_EMB + 2.4
    for i in range(1, 12):
        xi = W * i / 12
        lines.append([P((xi, 1.2, top)), P((xi, D - 1.2, top))])
    s.add(lines, occ)

    # positional encoding plate, sliding in from the side
    PX = W + 16
    lines, occ = box((PX, 0, Z_EMB), (26, D, 2.4), shade={"+x": (0, 1.3), "+y": (90, 2.2)}, rng=s.rng)
    top = Z_EMB + 2.4
    for k, freq in enumerate([0.5, 1, 2, 4]):
        base = PX + 4.5 + k * 5.7
        pts = [(base + 2.1 * math.sin(2 * math.pi * freq * t / 120), 2 + (D - 4) * t / 120) for t in range(121)]
        lines.append([P((px, py, top)) for px, py in pts])
    s.add(lines, occ)
    s.add(arrow([P((PX - 2, D / 2, Z_EMB + 1.2)), P((W + 3, D / 2, Z_EMB + 1.2))], 2))


    # attention heads: square score grids, lower triangle hatched (causal mask)
    N, HW = 5, 13.5
    for h in range(3):
        hx = 0.5 + h * (HW + 2.5)
        hy = (D - HW) / 2
        lines, occ = box((hx, hy, Z_ATT), (HW, HW, 1.8), shade={"+x": (0, 1.3), "+y": (90, 2.0)}, rng=s.rng)
        top = Z_ATT + 1.8
        c = HW / N
        for i in range(N + 1):
            lines.append([P((hx + i * c, hy, top)), P((hx + i * c, hy + HW, top))])
            lines.append([P((hx, hy + i * c, top)), P((hx + HW, hy + i * c, top))])
        for row in range(N):
            for col in range(row + 1):
                cell = top_face_poly((hx + col * c, hy + row * c, top), c, c).buffer(-0.25)
                lines += hatch(cell, 30, 0.95)
        s.add(lines, occ)


    # normalization plate: stippled
    lines, occ = box((0, 0, Z_NORM), (W, D, 1.6), shade={"+x": (0, 1.3), "+y": (90, 2.2)}, rng=s.rng)
    lines += stipple(top_face_poly((0, 0, Z_NORM + 1.6), W, D).buffer(-1.2), 260, s.rng, dot=0.3)
    s.add(lines, occ)

    # feed-forward: two rows of units, fully connected
    lo = [(9 + i * 9.5, D - 4, Z_FF0) for i in range(4)]
    hi = [(2 + i * 8.4, 4, Z_FF1) for i in range(6)]
    s.add([[P(a), P(b)] for a in lo for b in hi])
    for c in lo + hi:
        s.add(*sphere(c, 2.9, s.rng, dots=30))

    # residual connections: pipes bypassing each layer on the near side
    for z0, z1 in [(Z_EMB + 1, Z_NORM + 1), (Z_NORM + 1, Z_FF1)]:
        a, b = (W * 0.02, D + 3, z0), (W * 0.02, D + 3, z1)
        mid = (z1 - z0) * 0.35
        curve = bezier(P(a), P((-14, D + 3, z0 + mid)), P((-14, D + 3, z1 - mid)), P(b))
        s.add(arrow(curve, 2.2))
        s.add(arrow([[x + 1.0, y] for x, y in curve], 0.1)[:1])

    # the foundation: one neuron under the stack, its inputs, its output feeding
    # up into the tokens, and backprop looping from the output to the inputs
    # (drawn in screen space; +x here lands on the left once mirrored)
    nx, ny = P((W / 2, D / 2, Z_TOK - 36))
    r = 4.6
    s.add(arrow([(nx, ny - r - 1), P((W / 2, D / 2, Z_TOK - 9))], 2))
    for k in (-1, 0, 1):
        s.add(arrow([(nx + 26, ny + k * 7), (nx + r + 1.5, ny + k * 2.2)], 1.8))
    loop = bezier((nx - 1, ny - r - 9), (nx + 10, ny - 20), (nx + 30, ny - 17), (nx + 28, ny - 9), 50)
    s.add(dashed(loop, 2.2, 1.4) + arrow_head(loop[-1], loop[-5], 1.8))
    s.add(*sphere((W / 2, D / 2, Z_TOK - 36), r, s.rng, dots=55))
    return s


def walk(rng, n, vol=1.0):
    """A jagged price-like line: n points of a random walk."""
    v, out = 0.0, []
    for _ in range(n):
        out.append(v)
        v += rng.gauss(0, vol)
    return out


def zigzag(a, b, n=9, amp=1.6):
    """A pulse between two screen points, zigzagging across the line."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    ln = math.hypot(dx, dy) or 1
    nx, ny = -dy / ln, dx / ln
    pts = []
    for i in range(n + 1):
        k = 0 if i in (0, n) else (amp if i % 2 else -amp)
        pts.append((a[0] + dx * i / n + nx * k, a[1] + dy * i / n + ny * k))
    return pts


def pulses(a, b, n=5, amp=2.0):
    """A square-wave pulse train from screen point a to b, the way a signal is
    drawn on a timing diagram (a zigzag reads as lightning)."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    ln = math.hypot(dx, dy) or 1
    nx, ny = -dy / ln * amp, dx / ln * amp
    pts = [a]
    for i in range(n):
        t0, t1 = (i + 0.25) / n, (i + 0.75) / n
        p0 = (a[0] + dx * t0, a[1] + dy * t0)
        p1 = (a[0] + dx * t1, a[1] + dy * t1)
        pts += [p0, (p0[0] + nx, p0[1] + ny), (p1[0] + nx, p1[1] + ny), p1]
    pts.append(b)
    return pts


def card(s, base, w, h, rows, rng, thick=0.9, indents=(0, 1, 1, 2, 1, 0, 1, 2, 2, 1)):
    """A chunk of code facing the viewer: a screen-upright card of dashed rows.
    base is its bottom-left corner in world space; w, h are screen units."""
    c = [base, flat(base, w), flat(base, w, h), flat(base, 0, h)]
    edge = (thick, 0, 0)
    back = [add(p, edge) for p in c]
    front = [P(p) for p in c]
    lines = [front + [front[0]]]
    # the card's thickness shows along its right and bottom edges
    lines.append([P(c[1]), P(back[1]), P(back[2]), P(c[2])])
    lines.append([P(c[0]), P(back[0]), P(back[1])])
    for q in range(rows):
        z = h - 1.6 - q * 2.2
        if z < 0.8:
            break
        ind = indents[q % len(indents)] * 1.3
        seg = rng.uniform(w * 0.35, w * 0.8 - ind)
        lines.append([P(flat(base, 1.2 + ind, z)), P(flat(base, 1.2 + ind + seg, z))])
    occ = Polygon(front).union(Polygon([P(c[0]), P(back[0]), P(back[1]), P(back[2]), P(c[2]), P(c[3])]).convex_hull)
    s.add(lines, occ)


def pipe(s, a, b, r, flanges=True):
    s.add(*cylinder(a, b, r, hatch_side=4, rings=(0.08, 0.92) if flanges else ()))


def valve(s, c, axis, open_=True, size=3.2):
    """A valve body on a pipe with its lever: along the pipe when open, across it when shut."""
    s.add(*box((c[0] - size / 2, c[1] - size / 2, c[2] - size / 2), (size, size, size), shade={"+x": (0, 0.7)}, rng=s.rng))
    top = (c[0], c[1], c[2] + size / 2)
    d = {"x": (1, 0, 0), "y": (0, 1, 0)}[axis if open_ else ("y" if axis == "x" else "x")]
    end = add(top, (d[0] * 6, d[1] * 6, 1.5))
    s.add([[P(top), P(end)]])
    s.add(*sphere(end, 0.9, s.rng, dots=4))


def code_rows(o, width, rows, spacing, rng, margin=3.5):
    """Dashed code lines on a horizontal sheet: rows run along x, indents in x."""
    x0, y0, z = o
    out = []
    plan = [0, 1, 1, 2, 2, 1, 0, 1, 2, 3, 3, 2, 1, 0]
    for r in range(rows):
        x = x0 + margin + plan[r % len(plan)] * 2.2
        end = x0 + width - 1.5 - rng.uniform(0, width * 0.3)
        y = y0 + 1.8 + r * spacing
        while x < end:
            w = rng.uniform(1.2, 4.0)
            out.append([P((x, y, z)), P((min(x + w, end), y, z))])
            x += w + 0.9
    return out


# ── Monte Carlo Portfolio Risk Engine ────────────────────────────────────────
# A bench machine. Punched paper tape carrying three price histories comes off
# a reel on its bracket, through a guillotine that cuts it into contiguous
# blocks, into a lottery-style wire drum on a stand with a crank. A chart
# recorder prints the result: a fan of simulated futures and, beside it, the
# histogram of outcomes whose left tail runs past the dashed Gaussian.


def monteCarlo():
    s = Scene(mirror=False, seed=11, bold=0.5)
    rng = s.rng
    TZ, TW = 16, 12  # tape height and width

    # the bench plate everything stands on
    s.add(*rbox((-14, -12, -3), (136, TW + 26, 3), r=3, shade=0, rng=rng))
    for x in (-10, 118):
        for y in (-8, TW + 10):
            s.add([circle3((x, y, 0.01), (1, 0, 0), (0, 1, 0), 0.9, 20)], outline=False)

    # reel on an upright bracket
    RZ = TZ - 1
    s.add(*rbox((-3, TW + 3.5, 0), (6, 2.5, RZ + 2), r=0.8, shade=0.3, rng=rng))
    s.add(*contour_cylinder((0, -1.5, RZ), (0, TW + 1.5, RZ), 7.5, rings=3, shade=0.2, rng=rng))
    for y0, y1 in [(-2.3, -1.5), (TW + 1.5, TW + 2.3)]:
        lines, occ = cylinder((0, y0, RZ), (0, y1, RZ), 12)
        face = y1 if y1 > 0 else y0
        # three windows cut through the flange, like a film reel
        _, u, v = perp_frame((0, 1, 0))
        for k in range(3):
            t0 = 2 * math.pi * k / 3 + 0.35
            win = [add((0, face, RZ), add(mul(u, rr * math.cos(t)), mul(v, rr * math.sin(t))))
                   for rr, ts in [(4.2, [t0 + i * 0.06 for i in range(24)]), (9.8, [t0 + 1.4 - i * 0.06 for i in range(24)])] for t in ts]
            lines.append([P(q) for q in win + win[:1]])
        lines.append(circle3((0, face, RZ), u, v, 2.2, 30))
        s.add(lines, occ)
    s.add(*contour_cylinder((0, TW + 2.3, RZ), (0, TW + 4.5, RZ), 1.2, rings=0, shade=0, rng=rng))

    # the tape: sprocket holes along both edges, three assets moving together
    common = walk(rng, 70, 0.9)
    series = [[c + o for c, o in zip(common, walk(rng, 70, 0.45))] for _ in range(3)]
    X0, X1 = 4, 44
    tape = [(X0, 0, TZ), (X1, 0, TZ), (X1, TW, TZ), (X0, TW, TZ)]
    lines = []
    for x in range(int(X0) + 1, int(X1), 2):
        for y in (1.0, TW - 1.0):
            lines.append([P((x + dx * 0.45, y + dy * 0.45, TZ)) for dx, dy in [(-1, -1), (1, -1), (1, 1), (-1, 1), (-1, -1)]])
    for k, ser in enumerate(series):
        base = 3.2 + k * 2.8
        lo, hi = min(ser), max(ser)
        lines.append([P((X0 + 1 + (X1 - X0 - 2) * i / 69, base + 2.0 * (v - lo) / (hi - lo + 1e-9) - 1.0, TZ)) for i, v in enumerate(ser)])
    # the tape leaves the reel over its top
    lines.append([P((0, 0, RZ + 7.5)), P((X0, 0, TZ))])
    lines.append([P((0, TW, RZ + 7.5)), P((X0, TW, TZ))])
    s.add(lines, Polygon([P(q) for q in tape]))

    DX, DZ, R = 66, 19, 12  # the drum, placed here so the tray can reach it

    # the guillotine: base, two round columns, a crosshead, the blade on its rod
    GX = 30
    s.add(*rbox((GX - 6, -7, 0), (12, TW + 14, 2.5), r=1.5, shade=0, rng=rng))
    for y in (-4.5, TW + 4.5):
        s.add(*contour_cylinder((GX, y, 2.5), (GX, y, 40), 1.6, rings=0, bands=(0.06, 0.94), shade=0.4, rng=rng))
    s.add(*rbox((GX - 3.5, -7.5, 40), (7, TW + 15, 4.5), r=1.5, shade=0.4, rng=rng))
    s.add(*contour_cylinder((GX, TW / 2, 44.5), (GX, TW / 2, 49), 2.6, rings=0, bands=(0.5,), shade=0.3, rng=rng))
    s.add(*contour_cylinder((GX, TW / 2, 29), (GX, TW / 2, 40), 1.0, rings=0, shade=0.3, rng=rng))
    blade = [(GX - 0.5, -3, TZ + 2), (GX + 0.5, -3, TZ + 2), (GX + 0.5, TW + 3, TZ + 5), (GX - 0.5, TW + 3, TZ + 5)]
    s.add(*box((GX - 0.6, -3.2, TZ + 5), (1.2, TW + 6.4, 11), shade={"+x": (0, 1.8)}, rng=rng))
    s.add([[P((GX + 0.6, -3.2, TZ + 5)), P((GX + 0.6, TW + 3.2, TZ + 8))]], outline=False)
    s.add([[P((GX - 5, -7, 1.25)), P((GX - 5, TW + 7, 1.25))]], outline=False)

    # cut blocks: pieces of the same tape, all three lines kept
    def block(x, y, z, w=6.5):
        lines = []
        for k in range(3):
            ys = walk(rng, 9, 0.5)
            lines.append([P((x + 0.4 + (w - 0.8) * i / 8, y + 3.2 + k * 2.8 + max(-1, min(1, v)), z)) for i, v in enumerate(ys)])
        for xx in (x + 1.5, x + w - 1.5):
            for yy in (y + 1, y + TW - 1):
                lines.append([P((xx + dx * 0.45, yy + dy * 0.45, z)) for dx, dy in [(-1, -1), (1, -1), (1, 1), (-1, 1), (-1, -1)]])
        quad = [(x, y, z), (x + w, y, z), (x + w, y + TW, z), (x, y + TW, z)]
        s.add([[P(a), P(b)] for a, b in zip(quad, quad[1:] + quad[:1])] + lines, Polygon([P(q) for q in quad]))

    # a sloped tray from the blade into the drum, with low side lips
    tray = [(GX + 1.5, -1, TZ - 0.4), (DX - R + 1, -1, DZ - 2), (DX - R + 1, TW + 1, DZ - 2), (GX + 1.5, TW + 1, TZ - 0.4)]
    lips = [[P(tray[0]), P(tray[1]), P(add(tray[1], (0, 0, 1.2))), P(add(tray[0], (0, 0, 1.2))), P(tray[0])],
            [P(tray[3]), P(tray[2]), P(add(tray[2], (0, 0, 1.2))), P(add(tray[3], (0, 0, 1.2))), P(tray[3])]]
    s.add([[P(a), P(b)] for a, b in zip(tray, tray[1:] + tray[:1])] + lips, Polygon([P(q) for q in tray]))
    block(GX + 3, 0, TZ - 0.1)
    block(GX + 12, 0, TZ - 1.1)

    # the drum on its A-frame stand, with a crank
    ys = (-3, TW + 3)
    for y in (ys[0] - 2.2, ys[1] + 2.2):
        for sx in (-1, 1):
            s.add(*tube([(DX + sx * 8, y, 0.4), (DX, y, DZ)], 0.6))
            s.add(*rbox((DX + sx * 8 - 1.4, y - 1.2, 0), (2.8, 2.4, 0.8), r=0.6, shade=0, rng=rng))
        s.add(*tube([(DX - 4.2, y, DZ * 0.45), (DX + 4.2, y, DZ * 0.45)], 0.45))
    for x, z in [(DX - 5, DZ - 4), (DX + 1, DZ - 7)]:
        block(x, -0.5, z, 5.5)
    _, u, v = perp_frame((0, 1, 0))
    for y in ys:
        s.add([circle3((DX, y, DZ), u, v, R, 90), circle3((DX, y, DZ), u, v, R - 0.8, 90)]
              + [[P(add((DX, y, DZ), mul(add(mul(u, math.cos(t)), mul(v, math.sin(t))), rr))) for rr in (1.2, R - 0.8)]
                 for t in [2 * math.pi * k / 6 for k in range(6)]], outline=False)
    for k in range(18):
        t = 2 * math.pi * k / 18
        off = add(mul(u, R * math.cos(t)), mul(v, R * math.sin(t)))
        s.add([[P(add((DX, ys[0], DZ), off)), P(add((DX, ys[1], DZ), off))]], outline=False)
    # the hatch in the cage
    s.add([[P(add((DX, y, DZ), add(mul(u, R * math.cos(t)), mul(v, R * math.sin(t))))) for t, y in
            [(1.9, 1), (1.9, TW - 1), (2.6, TW - 1), (2.6, 1), (1.9, 1)]]], outline=False)
    s.add(*contour_cylinder((DX, ys[0] - 3.2, DZ), (DX, ys[1] + 3.2, DZ), 1.1, rings=0, shade=0.2, rng=rng))
    # crank
    s.add(*tube([(DX, ys[1] + 3.2, DZ), (DX + 6, ys[1] + 3.6, DZ + 4)], 0.55))
    s.add(*contour_cylinder((DX + 6, ys[1] + 3.6, DZ + 4), (DX + 6, ys[1] + 7.5, DZ + 4), 0.9, rings=1, shade=0.3, rng=rng))

    # the chart recorder, printing the futures
    CX = 84
    s.add(*rbox((CX, -4, 0), (18, TW + 8, 16), r=2, shade=0.35, rng=rng))
    # knobs and a slot on its front
    for k in range(3):
        s.add(*contour_cylinder((CX + 4 + k * 4, TW + 4, 4), (CX + 4 + k * 4, TW + 5.2, 4), 1.1, rings=0, shade=0, rng=rng))
    slot = (CX + 18, TW / 2 - 7, 10.5)
    s.add([[P(slot), P((slot[0], slot[1] + 14, slot[2]))]], outline=False)

    # the printout: a sheet facing the viewer, curling at its end
    o = (slot[0], slot[1] + 7, slot[2])
    SW, SH = 50, 28
    base = flat(o, 0, -slot[2] + 0.6)
    sheet = [P(flat(base, 0, 0)), P(flat(base, SW - 6, 0))]
    curl = bezier(P(flat(base, SW - 6, 0)), P(flat(base, SW + 1, 2)), P(flat(base, SW + 1, SH - 4)), P(flat(base, SW - 4, SH)), 30)
    sheet += curl[1:] + [P(flat(base, 0, SH))]
    paper = Polygon(sheet)
    lines = []
    # faint chart grid
    for gx in range(6, int(SW - 8), 8):
        lines += [[P(flat(base, gx, 1.5)), P(flat(base, gx, 3))]]
    # the fan of simulated paths
    start = flat(base, 3, SH * 0.58)
    FW = SW * 0.6
    for k in range(18):
        z, pts = 0.0, []
        for i in range(46):
            pts.append(P(flat(start, FW * i / 45, z)))
            shock = rng.gauss(0, 0.8)
            if rng.random() < 0.028:
                shock -= rng.uniform(3, 4.5)
            z += shock * 0.7
        lines.append(pts)
    # histogram of where they ended: bars, hatched tail, dashed Gaussian
    H = P(flat(start, FW + 4))
    bins = [1, 0, 1, 1, 2, 1, 3, 5, 8, 11, 13, 12, 9, 5, 3, 1]
    bh, bw, mid = 1.5, 0.95, 10.5
    for i, c in enumerate(bins):
        if c == 0:
            continue
        y = H[1] - (i - mid) * bh
        bar = Polygon([(H[0], y), (H[0] + c * bw, y), (H[0] + c * bw, y - bh * 0.78), (H[0], y - bh * 0.78)])
        lines.append(list(bar.exterior.coords))
        if i < 6:
            lines += hatch(bar.buffer(-0.12), 45, 0.42)
    lines.append([(H[0], H[1] + (mid + 1) * bh), (H[0], H[1] - (len(bins) - mid) * bh)])
    g = [(H[0] + 13 * bw * math.exp(-0.5 * ((q - 10.6) / 1.9) ** 2), H[1] - (q - mid - 0.4) * bh) for q in [t / 4 for t in range(0, 66)]]
    lines += dashed(g, 1.2, 0.9)
    s.add(lines + [sheet + [sheet[0]]], paper, outline=False, heavy=[sheet + [sheet[0]]])
    return s


# ── AccliMate ────────────────────────────────────────────────────────────────
# A repository as a stack of code sheets. One sheet is lifted and parsed: its
# syntax tree rises as machined nodes on rods, the leaves are chunks of
# different heights (cut by structure, not line count), bracketed leader lines
# cite the exact rows each came from, and the cited chunks stack up ranked.


def acclimate():
    s = Scene(mirror=False, seed=5)
    rng = s.rng
    SW, SD, SP = 30, 40, 2.8

    # the repository: a fanned stack of sheets
    for k in range(5):
        o = (k * 0.9, -k * 0.9, k * 1.0)
        lines, occ = box(o, (SW, SD, 0.4), rng=rng)
        if k == 4:
            lines += code_rows((o[0], o[1], o[2] + 0.4), SW, 13, SP, rng)
        s.add(lines, occ)

    # the lifted sheet, with brackets citing row ranges in its margin
    L = (6, -2, 30)
    TOPZ = L[2] + 0.4
    lines, occ = box(L, (SW, SD, 0.4), rng=rng)
    lines += code_rows((L[0], L[1], TOPZ), SW, 13, SP, rng)
    row_y = lambda r: L[1] + 1.8 + r * SP
    cites = [(9, 11), (3, 8), (0, 2)]
    marks = []
    for r0, r1 in cites:
        y0, y1 = row_y(r0) - 1.0, row_y(r1) + 1.0
        bx = L[0] + 1.2
        for off in (0, 0.35):
            lines.append([P((bx + 2.2, y0, TOPZ)), P((bx + off, y0, TOPZ)), P((bx + off, y1, TOPZ)), P((bx + 2.2, y1, TOPZ))])
        marks.append((bx, (y0 + y1) / 2, TOPZ))
    s.add(lines, occ)
    s.add(dashed([P((L[0] + SW / 2, SD / 2, 6)), P((L[0] + SW / 2, SD / 2, L[2] - 1))], 1.5, 1.2))
    s.add(arrow([P((L[0] + SW / 2, SD / 2, L[2] - 3)), P((L[0] + SW / 2, SD / 2, L[2] - 1))], 1.8)[1:])

    # leaves: chunks as tall as the rows they hold, standing above the sheet
    base = (L[0] + 2, L[1] + SD / 2, 58)
    heights = [3 * 2.2 + 1.2, 6 * 2.2 + 1.2, 3 * 2.2 + 1.2, 1 * 2.2 + 1.8]
    xs = [-34, -16, 2, 20]
    tops = []
    for (x, h) in zip(xs, heights):
        b = flat(base, x)
        card(s, b, 13, h, int(h / 2.2), rng)
        tops.append(flat(b, 6.5, h))
    # leader lines: each cited chunk to the bracket around its rows
    for x, mk in zip(xs[:3], marks):
        s.add(dashed([P(flat(base, x + 1.5)), P(mk)], 1.4, 1.0) + arrow_head(P(mk), P(flat(base, x + 1.5)), 1.6))

    # the syntax tree: machined node plates on rods, root at the top
    def node(c, w=4.5):
        s.add(*box((c[0] - w / 2, c[1] - w / 2, c[2] - 0.8), (w, w, 1.6), shade={"+x": (0, 0.6), "+y": (90, 0.6)}, rng=rng))

    root = flat(base, -2, 62)
    lvl1 = [flat(base, -20, 46), flat(base, 14, 46)]
    lvl2 = [flat(base, -28, 32), flat(base, -10, 32), flat(base, 8, 32), flat(base, 26, 32)]
    edges = [(root, lvl1[0]), (root, lvl1[1]), (lvl1[0], lvl2[0]), (lvl1[0], lvl2[1]), (lvl1[1], lvl2[2]), (lvl1[1], lvl2[3])]
    edges += list(zip(lvl2, tops))
    for a, b in edges:
        s.add([[P(a), P(b)]])
    for c in [root] + lvl1 + lvl2:
        node(c)

    # ranked: the cited chunks, best first, stacked beside the tree
    rb = flat(base, 48, 4)
    s.add(arrow([P(flat(base, 36, 10)), P(flat(base, 46, 10))], 1.8))
    z = 0
    for h in (heights[1], heights[0], heights[2]):
        card(s, flat(rb, 0, z), 13, h, int(h / 2.2), rng)
        z += h + 2.2
    return s


# ── Capacitor Matching Network Solver ────────────────────────────────────────
# A drawer cabinet of real parts, a search tree above it with its pruned
# branches snipped, and the one surviving assignment dropping four matched
# capacitors symmetrically into a diamond bridge on a board.


def disc_cap(s, c, r=1.8, lead=4.5):
    """A disc capacitor standing up: a flat disc on two wire leads."""
    x, y, z = c
    for dx in (-0.8, 0.8):
        s.add([[P((x + dx, y, z)), P((x + dx, y, z + lead))]])
    s.add(*cylinder((x, y - 0.5, z + lead + r), (x, y + 0.5, z + lead + r), r, hatch_side=2))


def capMatch():
    s = Scene(mirror=False, seed=3)
    rng = s.rng

    # parts cabinet: drawer grid on its front, three drawers pulled
    CW, CD, CH = 40, 16, 26
    CX = 44  # the cabinet sits back and to the right of the board
    s.add(*box((CX, 0, 0), (CW, CD, CH), shade={"+x": (0, 1.1)}, rng=rng))
    cols, rows = 4, 3
    dw, dh = CW / cols, CH / rows
    grid = [[P((CX + i * dw, CD, 0)), P((CX + i * dw, CD, CH))] for i in range(cols + 1)]
    grid += [[P((CX, CD, j * dh)), P((CX + CW, CD, j * dh))] for j in range(rows + 1)]
    grid += [[P((CX + i * dw + dw / 2 - 1.6, CD, j * dh + dh * 0.62)), P((CX + i * dw + dw / 2 + 1.6, CD, j * dh + dh * 0.62))] for i in range(cols) for j in range(rows)]
    s.add(grid)
    for i, j, pull in [(1, 2, 9), (3, 1, 6), (0, 0, 7)]:
        o = (CX + i * dw + 0.6, CD, j * dh + 0.6)
        size = (dw - 1.2, pull, dh - 1.8)
        s.add(*box(o, size, shade={"+x": (0, 0.9)}, rng=rng))
        for q in range(4):
            px = o[0] + 1.8 + (q % 2) * (size[0] - 3.6)
            py = o[1] + 1.8 + (q // 2) * (pull - 3.6)
            s.add(*cylinder((px, py, o[2] + size[2]), (px, py, o[2] + size[2] + 0.5), rng.uniform(0.9, 1.4)))

    # the search tree, facing the viewer: explored, pruned, one path survives
    BY0, BY1 = CD + 16, CD + 46
    cx, cy = CW / 2, (BY0 + BY1) / 2
    root = flat((cx, cy, 0), -7.7, 100)
    survivors = [root]
    spreads = [26, 13, 7, 3.6, 1.9]
    path = [1, 0, 0, 1, 0]

    def grow(p, depth, alive):
        if depth == len(spreads):
            return
        for k in (0, 1):
            c = flat(p, -spreads[depth] if k == 0 else spreads[depth], -11)
            if alive and k == path[depth]:
                a, b = P(p), P(c)
                s.add([[a, b], [(a[0] + 0.7, a[1]), (b[0] + 0.7, b[1])]])
                survivors.append(c)
                grow(c, depth + 1, True)
            elif depth < 3 and rng.random() < 0.75:
                s.add([[P(p), P(c)]])
                grow(c, depth + 1, False)
            else:
                stop = lerp(p, c, 0.5)
                a, b = P(stop), P(c)
                ln = math.hypot(b[0] - a[0], b[1] - a[1]) or 1
                nx, ny = -(b[1] - a[1]) / ln * 1.4, (b[0] - a[0]) / ln * 1.4
                s.add([[P(p), a], [(a[0] - nx, a[1] - ny), (a[0] + nx, a[1] + ny)]])

    grow(root, 0, True)
    for c in survivors:
        s.add(*sphere(c, 1.1, rng, dots=5))
    end = survivors[-1]

    # the board in front: a diamond bridge with four footprints
    s.add(*box((2, BY0, 0), (CW - 4, BY1 - BY0, 1.6), shade={"+x": (0, 0.9), "+y": (90, 1.3)}, rng=rng))
    top = 1.6
    rr = 12
    corners = [(cx, cy - rr), (cx + rr, cy), (cx, cy + rr), (cx - rr, cy)]
    s.add([[P((a[0], a[1], top)), P((b[0], b[1], top))] for a, b in zip(corners, corners[1:] + corners[:1])])
    for a in (corners[0], corners[2]):
        s.add(*cylinder((a[0], a[1], top), (a[0], a[1], top + 0.3), 1.6))
    mids = [((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) for a, b in zip(corners, corners[1:] + corners[:1])]
    s.add([[P((m[0] + dx, m[1] + dy, top)) for dx, dy in [(-1.8, -1.8), (1.8, -1.8), (1.8, 1.8), (-1.8, 1.8), (-1.8, -1.8)]] for m in mids])
    for m in mids:
        s.add(dashed([P(end), P((m[0], m[1], top + 12))], 1.6, 1.2))
    for m in mids:
        disc_cap(s, (m[0], m[1], top + 3), r=1.9, lead=4)
    return s


# ── Sprite Room ──────────────────────────────────────────────────────────────
# The top of a laptop screen with a pixel room hanging from its notch like a
# drawer: flat pixel sprites on a tiled floor. A tape of tool-call events
# runs in from a reel, through a one-way check valve, into the room.

CHARACTER = [
    "......#",
    "..++++#",
    "..++++#",
    "..++++#",
    "...++.#",
    ".######",
    "#.####.",
    "#.####.",
    "+.####.",
    "..++++.",
    "..+..+.",
    "..+..+.",
    ".++..++",
]
DESK = [
    ".#######.",
    ".#+++++#.",
    ".#+#++++.",
    ".#++++##.",
    ".#######.",
    "....#....",
    "..#####..",
    "+++++++++",
    "+.......+",
    "+.......+",
    "+.......+",
]
SHELF = [
    "#.##.+#.##",
    "#.##.+#.##",
    "#.##.+#.##",
    "++++++++++",
]
PLANT = [
    ".#.#.",
    "#.#.#",
    ".###.",
    "..#..",
    ".+++.",
    ".+++.",
]


def spriteRoom():
    s = Scene(mirror=True, seed=9)
    rng = s.rng
    LW, T, Z0, Z1 = 84, 2.5, 6, 52

    # the lid: screen border, the notch (hatched black), a cut end showing its layers
    lines, occ = box((0, 0, Z0), (LW, T, Z1 - Z0), shade={"+x": (0, 0.7)}, rng=rng)
    for f in (0.35, 0.7):
        lines.append([P((LW, T * f, Z0)), P((LW, T * f, Z1))])
    NX0, NX1, NB = LW / 2 - 7, LW / 2 + 7, Z1 - 5.5
    lines.append([P((3, T, Z0)), P((3, T, Z1 - 3)), P((NX0, T, Z1 - 3))])
    lines.append([P((NX1, T, Z1 - 3)), P((LW - 3, T, Z1 - 3)), P((LW - 3, T, Z0))])
    notch = Polygon([P((NX0, T, Z1 - 3)), P((NX0 + 1, T, NB)), P((NX1 - 1, T, NB)), P((NX1, T, Z1 - 3))])
    lines.append(list(notch.exterior.coords))
    lines += hatch(notch.buffer(-0.1), 70, 0.45)
    s.add(lines, occ)

    # the room: hung from the notch, open toward the viewer
    RX0, RX1, RY0, RY1, RZ0 = NX0 - 12, NX1 + 12, T, T + 28, NB - 32
    s.add([[P((NX0 + 1, T, NB)), P((RX0, RY0, RZ0 + 24))], [P((NX1 - 1, T, NB)), P((RX1, RY0, RZ0 + 24))]])
    s.add(*box((RX0, RY0, RZ0 - 1.4), (RX1 - RX0, RY1 - RY0, 1.4), shade={"+x": (0, 0.8), "+y": (90, 0.9)}, rng=rng))
    walls = [[P((RX0, RY1, RZ0)), P((RX0, RY1, RZ0 + 16)), P((RX0, RY0, RZ0 + 24)), P((RX1, RY0, RZ0 + 24)), P((RX1, RY0, RZ0))],
             [P((RX0, RY0, RZ0)), P((RX0, RY0, RZ0 + 24))]]
    walls += [[P((RX0 + (RX1 - RX0) * i / 10, RY0, RZ0)), P((RX0 + (RX1 - RX0) * i / 10, RY1, RZ0))] for i in range(1, 10)]
    walls += [[P((RX0, RY0 + (RY1 - RY0) * j / 12, RZ0)), P((RX1, RY0 + (RY1 - RY0) * j / 12, RZ0))] for j in range(1, 12)]
    s.add(walls)
    u = 1.45
    ex, ez = (1, 0, 0), (0, 0, 1)
    s.add(*sprite(SHELF, (RX0 + 16, RY0 + 0.01, RZ0 + 15), ex, ez, u))
    s.add(*sprite(PLANT, (RX1 - 8, RY0 + 3, RZ0), ex, ez, u))
    s.add(*sprite(DESK, (RX0 + 2, RY0 + 8, RZ0), ex, ez, u))
    s.add(*sprite(CHARACTER, (RX0 + 21, RY0 + 15, RZ0), ex, ez, u * 1.1))

    # the event tape: blocks riding in from a reel, through the valve, into the room
    TZ = RZ0 + 2
    TX0, TX1 = RX1, RX1 + 56
    TY0, TY1 = RY0 + 15, RY0 + 21
    tape = [(TX0, TY0, TZ), (TX1, TY0, TZ), (TX1, TY1, TZ), (TX0, TY1, TZ)]
    s.add([[P(a), P(b)] for a, b in zip(tape, tape[1:] + tape[:1])], Polygon([P(p) for p in tape]))
    VX0, VX1, VR = TX0 + 14, TX0 + 26, 6
    for k in range(7):
        x = TX0 + 2.5 + k * 7.5
        if VX0 - 5 < x < VX1 + 1:
            continue
        s.add(*box((x, TY0 + 1, TZ), (4, TY1 - TY0 - 2, 1.6), shade={"+x": (0, 0.5)}, rng=rng))
    RLX = TX1 + 6
    s.add(*cylinder((RLX, TY0 - 2, TZ - 6), (RLX, TY1 + 2, TZ - 6), 6, hatch_side=4))
    lines, occ = cylinder((RLX, TY1 + 2, TZ - 6), (RLX, TY1 + 2.7, TZ - 6), 8.5)
    for k in range(0, 360, 60):
        t = math.radians(k)
        lines.append([P((RLX + 2 * math.cos(t), TY1 + 2.7, TZ - 6 + 2 * math.sin(t))), P((RLX + 7.6 * math.cos(t), TY1 + 2.7, TZ - 6 + 7.6 * math.sin(t)))])
    s.add(lines, occ)

    # the check valve: a body around the tape, a window onto its flap
    cy, cz = (TY0 + TY1) / 2, TZ + 1
    lines, occ = cylinder((VX0, cy, cz), (VX1, cy, cz), VR, hatch_side=5, rings=(0.14, 0.86))
    win = Polygon([P((VX0 + 2.5, cy + VR * 0.2, cz + VR * 0.97)), P((VX1 - 2.5, cy + VR * 0.2, cz + VR * 0.97)),
                   P((VX1 - 2.5, cy + VR * 0.99, cz - VR * 0.05)), P((VX0 + 2.5, cy + VR * 0.99, cz - VR * 0.05))])
    hinge = ((VX0 + VX1) / 2 + 1.5, cy + 3, cz + VR * 0.8)
    s.add([[P((hinge[0] + 0.8, cy + 3, cz - 2)), P((hinge[0] + 0.8, cy + 3, cz + VR * 0.8))]])  # the seat
    s.add([[P(hinge), P((hinge[0] - 3.6, cy + 3, cz - 1.5))], [P((hinge[0] + 0.3, cy + 3, hinge[2])), P((hinge[0] - 3.3, cy + 3, cz - 1.5))]])
    s.add(*sphere(hinge, 0.7, rng, dots=3))
    s.add(lines + [list(win.exterior.coords)], occ.difference(win))
    s.add(arrow([P((VX1 - 1, cy, cz + VR + 3)), P((VX0 + 1, cy, cz + VR + 3))], 2))
    return s


# ── smallsh ──────────────────────────────────────────────────────────────────
# The shell as a manifold: a vessel whose pipes are the process tree. The
# foreground child's valve is open; two background children sit behind on a
# lower shelf, shut. A pipe joins one child to the next, a three-way valve
# redirects output into a drum, and a signal pulse arriving at the shell is
# caught and routed only to the foreground child.


def smallsh():
    s = Scene(mirror=True, seed=2)
    rng = s.rng

    # background jobs: behind, on a lower shelf, their valves shut
    s.add(*box((-24, -52, -16), (48, 16, 2), shade={"+x": (0, 1.1), "+y": (90, 1.4)}, rng=rng))
    for bx in (-12, 12):
        s.add(*cylinder((bx, -44, -14), (bx, -44, -4), 5, hatch_side=4, rings=(0.2,)))
        pipe(s, (bx, -44, -4), (bx, -44, 5), 1.2, flanges=False)
        pipe(s, (bx, -44, 5), (bx, -8, 5), 1.2)
        valve(s, (bx, -26, 5), "y", open_=False)

    # the shell: a squat vessel, its front cut open onto the catch
    VR, VH = 12, 18
    lines, occ = cylinder((0, 0, 0), (0, 0, VH), VR, hatch_side=7, rings=(0.15, 0.85))
    win = Polygon([P((VR * 0.2, VR * 0.98, 4)), P((VR * 0.98, VR * 0.2, 4)), P((VR * 0.98, VR * 0.2, 14.5)), P((VR * 0.2, VR * 0.98, 14.5))])
    piv = (5.5, 5.5, 9)
    spring = [P((5.5 + (0.7 if i % 2 else -0.7), 5.5 - (0.7 if i % 2 else -0.7), 13.8 - i * 0.3)) for i in range(12)]
    s.add([[P((2.5, 8.5, 6)), P(piv), P((9.5, 1.5, 12))], spring, [P((9.5, 1.5, 12)), P((11.5, 0, 8))]])
    s.add(*sphere(piv, 0.9, rng, dots=4))
    s.add(lines + [list(win.exterior.coords)], occ.difference(win))
    s.add(*cylinder((0, 0, VH), (0, 0, VH + 4), 3.5, hatch_side=3, rings=(0.5,)))

    # the foreground child: out along the open pipe
    pipe(s, (11, 0, 8), (32, 0, 8), 1.5)
    valve(s, (21, 0, 8), "x", open_=True)
    FG = 39
    s.add(*cylinder((FG, 0, 0), (FG, 0, 14), 7, hatch_side=6, rings=(0.2, 0.8)))
    # a literal pipe: the foreground child's output into the next child's input
    pipe(s, (46, 0, 6), (58, 0, 6), 1.3)
    NX = 64
    s.add(*cylinder((NX, 0, 0), (NX, 0, 11), 6, hatch_side=5, rings=(0.25,)))
    # redirection: the next child's outlet turned by a three-way valve into a drum
    pipe(s, (NX, 6, 5), (NX, 17, 5), 1.2)
    valve(s, (NX, 12, 5), "y", open_=True)
    s.add(*cylinder((NX - 9, 24, 3), (NX + 9, 24, 3), 6, hatch_side=6, rings=(0.1, 0.9)))
    pipe(s, (NX, 16, 5), (NX, 19, 5), 1.2, flanges=False)

    # signals: pulses striking the shell's inlet, one routed down the open pipe only
    s.add(arrow(pulses(P((0, 0, VH + 34)), P((0, 0, VH + 5.5)), 4, 2.2), 2.2))
    s.add(arrow(pulses(P((12, -12, VH + 30)), P((2.5, -2.5, VH + 5.5)), 4, 2.2), 2.2))
    s.add(arrow(pulses(P((13, 0, 13.5)), P((31, 0, 13.5)), 4, 2.0), 2))
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
