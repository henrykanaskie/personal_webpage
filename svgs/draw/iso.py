"""A small isometric line-drawing kit for the code-drawn drawings.

Everything is strokes: a scene is a list of items in paint order (back to
front), each some polylines plus the screen shape it hides. Rendering walks
front to back and cuts every line by what is already in front of it, so
hidden lines disappear the way they would in a hand-drawn plate. The output
is an SVG of plain stroked paths, the same shape as a traced drawing, so it
goes through convert.py like any other.
"""

import math
import random

from shapely.geometry import LineString, MultiPoint, Polygon
from shapely.ops import unary_union

COS30 = math.cos(math.radians(30))
VIEW = (1.0, 1.0, 1.0)  # direction toward the viewer: +x, +y and +z faces show


def P(p):
    """World (x, y, z) to screen (x, y), z up, isometric."""
    x, y, z = p
    return ((x - y) * COS30, (x + y) * 0.5 - z)


def add(a, b):
    return tuple(i + j for i, j in zip(a, b))


def sub(a, b):
    return tuple(i - j for i, j in zip(a, b))


def mul(a, k):
    return tuple(i * k for i in a)


def dot(a, b):
    return sum(i * j for i, j in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def norm(a):
    length = math.sqrt(dot(a, a)) or 1.0
    return mul(a, 1 / length)


def lerp(a, b, t):
    return tuple(i + (j - i) * t for i, j in zip(a, b))


def lines_of(geom):
    """Every polyline in a shapely result, as coordinate lists."""
    if geom.is_empty:
        return []
    if geom.geom_type == "LineString":
        return [list(geom.coords)]
    if hasattr(geom, "geoms"):
        return [c for g in geom.geoms for c in lines_of(g)]
    return []


class Scene:
    """bold: the ink width of silhouettes, in drawing units. Every solid's outline
    is drawn as a thick stroke, traced as the thin contour around its ink the
    way a traced drawing is, so it stays bold under the site's single stroke
    width; interior lines stay hairlines. That weight contrast is most of what
    separates an illustration from a diagram."""

    def __init__(self, mirror=False, seed=1, bold=0.55):
        self.items = []
        self.mirror = mirror
        self.rng = random.Random(seed)
        self.bold = bold

    def add(self, lines, occluder=None, group=None, outline=True, heavy=()):
        """lines: screen polylines (hairlines); occluder: screen polygon hiding
        what's behind, whose edge is drawn bold unless outline=False; heavy:
        extra polylines drawn bold."""
        self.items.append((lines, occluder, group, outline, list(heavy)))

    def render(self):
        hidden = None
        out = []
        for lines, occluder, group, outline, heavy in reversed(self.items):
            if occluder is not None and not occluder.is_empty:
                occluder = occluder.buffer(0)
            strong = list(heavy)
            if outline and occluder is not None and not occluder.is_empty:
                for g in getattr(occluder, "geoms", [occluder]):
                    strong.append(list(g.exterior.coords))
            ink = None
            vis_strong = []
            for pts in strong:
                if len(pts) < 2:
                    continue
                g = LineString(pts)
                if hidden is not None:
                    g = g.difference(hidden)
                vis_strong += lines_of(g)
            if vis_strong:
                ink = unary_union([LineString(c).buffer(self.bold / 2, quad_segs=4) for c in vis_strong if len(c) > 1])
            visible = []
            for pts in lines:
                if len(pts) < 2:
                    continue
                g = LineString(pts)
                if g.length < 1e-6:
                    continue
                if hidden is not None:
                    g = g.difference(hidden)
                if ink is not None:
                    g = g.difference(ink)
                visible += [c for c in lines_of(g) if LineString(c).length > 0.25]
            if ink is not None and not ink.is_empty:
                for poly in getattr(ink, "geoms", [ink]):
                    visible.append(list(poly.exterior.coords))
                    visible += [list(h.coords) for h in poly.interiors if Polygon(h).area > self.bold ** 2]
            out.append((group, visible))
            if occluder is not None and not occluder.is_empty:
                hidden = occluder if hidden is None else unary_union([hidden, occluder])
        out.reverse()
        return out

    def svg(self, path):
        groups = {}
        order = []
        for group, lines in self.render():
            key = group or f"_{len(order)}"
            if key not in groups:
                groups[key] = []
                order.append(key)
            groups[key] += lines
        sx = -1 if self.mirror else 1
        all_pts = [(sx * x, y) for k in order for ln in groups[k] for x, y in ln]
        xs, ys = [p[0] for p in all_pts], [p[1] for p in all_pts]
        pad = 4
        vb = (min(xs) - pad, min(ys) - pad, max(xs) - min(xs) + 2 * pad, max(ys) - min(ys) + 2 * pad)
        body = []
        # a few polylines per path: the site animates each path drawing itself,
        # so one path per part would draw a whole object in a single stroke
        per_path = 8
        for k in order:
            lines = groups[k]
            for i in range(0, len(lines), per_path):
                d = " ".join(
                    "M " + " L ".join(f"{sx * x:.2f} {y:.2f}" for x, y in ln) for ln in lines[i:i + per_path]
                )
                body.append(f'<path stroke="#000000" d="{d}"/>')
        with open(path, "w") as f:
            f.write(
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.2f} {vb[1]:.2f} {vb[2]:.2f} {vb[3]:.2f}">\n'
                f'<g fill="none" stroke-width="{max(vb[2], vb[3]) / 900:.3f}" stroke-linecap="round" stroke-linejoin="round">\n'
                + "\n".join(body)
                + "\n</g>\n</svg>\n"
            )


# ── Screen-space helpers ─────────────────────────────────────────────────────


def hatch(poly, angle, spacing, jitter=0.0, rng=None):
    """Parallel lines filling a screen polygon."""
    if poly.is_empty:
        return []
    minx, miny, maxx, maxy = poly.bounds
    cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
    r = math.hypot(maxx - minx, maxy - miny)
    a = math.radians(angle)
    d = (math.cos(a), math.sin(a))
    n = (-d[1], d[0])
    out = []
    k = -r
    while k <= r:
        off = k + (rng.uniform(-jitter, jitter) if rng and jitter else 0)
        p0 = (cx + n[0] * off - d[0] * r, cy + n[1] * off - d[1] * r)
        p1 = (cx + n[0] * off + d[0] * r, cy + n[1] * off + d[1] * r)
        out += lines_of(LineString([p0, p1]).intersection(poly))
        k += spacing
    return out


def stipple(poly, count, rng, dot=0.35):
    """Short specks scattered in a screen polygon (engraving stipple)."""
    minx, miny, maxx, maxy = poly.bounds
    out = []
    tries = 0
    while len(out) < count and tries < count * 20:
        tries += 1
        x, y = rng.uniform(minx, maxx), rng.uniform(miny, maxy)
        if poly.contains(MultiPoint([(x, y)]).geoms[0]):
            out.append([(x, y), (x + dot, y + dot * 0.3)])
    return out


def dashed(pts, dash=2.0, gap=1.5, dot_dash=False):
    """A polyline cut into dashes (dash-dot when dot_dash)."""
    line = LineString(pts)
    out = []
    pattern = [dash, gap, 0.3, gap] if dot_dash else [dash, gap]
    t, i, on = 0.0, 0, True
    while t < line.length:
        step = pattern[i % len(pattern)]
        if on:
            a, b = line.interpolate(t), line.interpolate(min(t + step, line.length))
            if b.distance(a) > 0.05:
                out.append([(a.x, a.y), (b.x, b.y)])
            elif step < 0.5:
                out.append([(a.x, a.y), (a.x + 0.3, a.y)])
        t += step
        i += 1
        on = not on
    return out


def arrow_head(tip, frm, size=2.2, spread=25):
    ang = math.atan2(tip[1] - frm[1], tip[0] - frm[0])
    out = []
    for s in (-1, 1):
        a = ang + math.pi - s * math.radians(spread)
        out.append((tip[0] + size * math.cos(a), tip[1] + size * math.sin(a)))
    return [[out[0], tip, out[1]]]


def arrow(pts, size=2.2):
    return [list(pts)] + arrow_head(pts[-1], pts[-2], size)


def bezier(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        out.append(tuple(u**3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t**3 * d for a, b, c, d in zip(p0, p1, p2, p3)))
    return out


# ── World-space primitives: each returns (lines, occluder) in screen space ───


def face_normal(face):
    n = (0.0, 0.0, 0.0)
    for i in range(len(face)):
        a, b = face[i], face[(i + 1) % len(face)]
        n = add(n, ((a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])))
    return norm(n)


def solid(faces, shade=None, rng=None):
    """A convex solid from outward-wound faces. shade: {face_index: (angle, spacing)}
    hatches that face when it shows."""
    lines, polys = [], []
    edges = set()
    for i, face in enumerate(faces):
        if dot(face_normal(face), VIEW) <= 1e-9:
            continue
        pts = [P(p) for p in face]
        poly = Polygon(pts)
        polys.append(poly)
        for j in range(len(pts)):
            a, b = pts[j], pts[(j + 1) % len(pts)]
            key = tuple(sorted([(round(a[0], 3), round(a[1], 3)), (round(b[0], 3), round(b[1], 3))]))
            if key not in edges:
                edges.add(key)
                lines.append([a, b])
        if shade and i in shade:
            angle, spacing = shade[i]
            lines += hatch(poly.buffer(-0.35), angle, spacing, jitter=spacing * 0.08, rng=rng)
    return lines, unary_union(polys) if polys else None


BOX_FACES = ("bottom", "top", "-y", "+x", "+y", "-x")


def box_faces(o, size):
    x, y, z = o
    w, d, h = size
    v = [(x, y, z), (x + w, y, z), (x + w, y + d, z), (x, y + d, z),
         (x, y, z + h), (x + w, y, z + h), (x + w, y + d, z + h), (x, y + d, z + h)]
    return [
        [v[0], v[3], v[2], v[1]],  # bottom
        [v[4], v[5], v[6], v[7]],  # top
        [v[0], v[1], v[5], v[4]],  # -y
        [v[1], v[2], v[6], v[5]],  # +x
        [v[2], v[3], v[7], v[6]],  # +y
        [v[3], v[0], v[4], v[7]],  # -x
    ]


def box(o, size, shade=None, rng=None):
    """Axis-aligned box from corner o. shade by name: {"+x": (angle, spacing)}."""
    idx = {n: i for i, n in enumerate(BOX_FACES)}
    return solid(box_faces(o, size), {idx[k]: v for k, v in (shade or {}).items()}, rng)


def frame(u, v):
    """Two unit vectors completing a normal into a frame."""
    u = norm(u)
    v = norm(v)
    return u, v


def circle3(c, u, v, r, n=72, a0=0.0, a1=2 * math.pi):
    return [P(add(c, add(mul(u, r * math.cos(a0 + (a1 - a0) * i / n)), mul(v, r * math.sin(a0 + (a1 - a0) * i / n))))) for i in range(n + 1)]


def perp_frame(axis):
    a = norm(axis)
    helper = (0, 0, 1) if abs(a[2]) < 0.9 else (1, 0, 0)
    u = norm(cross(a, helper))
    v = norm(cross(a, u))
    return a, u, v


def cylinder(c0, c1, r, hatch_side=0, n=72, rings=()):
    """Solid cylinder between two centres. hatch_side: number of engraved lines
    along the lit-to-dark side; rings: fractions along the axis for bands."""
    a, u, v = perp_frame(sub(c1, c0))
    cap0 = circle3(c0, u, v, r, n)
    cap1 = circle3(c1, u, v, r, n)
    hull = MultiPoint(cap0 + cap1).convex_hull
    lines = [list(hull.exterior.coords)]
    # the cap facing the viewer shows whole
    facing = cap1 if dot(a, VIEW) > 0 else cap0
    lines.append(facing)
    for f in rings:
        c = lerp(c0, c1, f)
        ring = [add(c, add(mul(u, r * math.cos(t)), mul(v, r * math.sin(t)))) for t in [2 * math.pi * i / n for i in range(n + 1)]]
        # only the half facing the viewer
        seg, segs = [], []
        for t_i in range(n + 1):
            t = 2 * math.pi * t_i / n
            nrm = add(mul(u, math.cos(t)), mul(v, math.sin(t)))
            if dot(nrm, VIEW) > 0:
                seg.append(P(ring[t_i]))
            elif seg:
                segs.append(seg)
                seg = []
        if seg:
            segs.append(seg)
        lines += [s for s in segs if len(s) > 1]
    if hatch_side:
        # engraved lines along the side away from the light (upper left), crowding
        # toward the silhouette as the surface turns away
        mid = math.atan2(dot(v, VIEW), dot(u, VIEW))
        at = lambda t: add(mul(u, r * math.cos(t)), mul(v, r * math.sin(t)))
        side = 1 if P(at(mid + math.pi / 2))[0] > P(at(mid - math.pi / 2))[0] else -1
        for i in range(hatch_side):
            t = mid + side * (0.25 + (math.pi / 2 - 0.3) * i / max(hatch_side - 1, 1))
            lines.append([P(add(c0, at(t))), P(add(c1, at(t)))])
    return lines, hull


def sphere(c, r, rng, dots=40):
    """A stippled ball like the network drawing's nodes."""
    cx, cy = P(c)
    circ = Polygon([(cx + r * math.cos(t), cy + r * math.sin(t)) for t in [2 * math.pi * i / 72 for i in range(72)]])
    lines = [list(circ.exterior.coords)]
    # shade the lower right: crescent between the ball and a shifted ball
    lit = Polygon([(cx - r * 0.28 + r * 1.02 * math.cos(t), cy - r * 0.28 + r * 1.02 * math.sin(t)) for t in [2 * math.pi * i / 72 for i in range(72)]])
    shadow = circ.difference(lit).buffer(-0.2)
    lines += stipple(shadow, dots, rng, dot=max(0.18, r * 0.06))
    lines += stipple(circ.buffer(-r * 0.25).difference(lit.buffer(-r * 0.3)), dots // 4, rng, dot=max(0.18, r * 0.05))
    return lines, circ


def on_face(o, ex, ey, pts2):
    """Map 2D points (in units along ex, ey from o) onto a world plane, to screen."""
    return [P(add(o, add(mul(ex, a), mul(ey, b)))) for a, b in pts2]


# Along (1, -1, 0) a world offset projects to a pure horizontal screen offset,
# so diagrams meant to face the viewer (trees, graphs) spread along it.
FLAT = (COS30 / 1.5, -COS30 / 1.5, 0.0)


def flat(p, dx, dz=0.0):
    """Offset p so it moves dx screen units horizontally and dz up."""
    k = dx / (2 * COS30 * (COS30 / 1.5))
    return (p[0] + FLAT[0] * k, p[1] + FLAT[1] * k, p[2] + dz)


def sprite(rows, o, ex, ez, u):
    """A pixel-art sprite standing on a world plane: rows of '#' (ink, hatched),
    '+' (plain pixel) and '.' (empty), top row first. Returns lines, occluder."""
    from shapely.geometry import box as sbox
    cells, dark = [], []
    h = len(rows)
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            if ch in "#+":
                sq = sbox(c, h - 1 - r, c + 1, h - r)
                cells.append(sq)
                if ch == "#":
                    dark.append(sq)
    shape = unary_union(cells)
    to_screen = lambda pts: [P(add(o, add(mul(ex, a * u), mul(ez, b * u)))) for a, b in pts]
    lines, polys = [], []
    for g in getattr(shape, "geoms", [shape]):
        lines.append(to_screen(list(g.exterior.coords)))
        for hole in g.interiors:
            lines.append(to_screen(list(hole.coords)))
        polys.append(Polygon(to_screen(list(g.exterior.coords))))
    for g in getattr(unary_union(dark), "geoms", [unary_union(dark)]) if dark else []:
        poly = Polygon(to_screen(list(g.exterior.coords)))
        lines.append(list(poly.exterior.coords))
        lines += hatch(poly.buffer(-0.12), 60, u * 0.28)
    return lines, unary_union(polys)


# ── Softer, manufactured forms ───────────────────────────────────────────────

LIGHT = norm((-0.6, 0.25, 1.0))  # upper left, as in the engraved drawings


def rounded_rect(cx, cy, w, d, r, n=6):
    """Corner points of a rounded rectangle around (cx, cy), counter-clockwise."""
    r = min(r, w / 2, d / 2)
    pts = []
    for (qx, qy, a0) in [(w / 2 - r, -d / 2 + r, -90), (w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180)]:
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + qx + r * math.cos(a), cy + qy + r * math.sin(a)))
    return pts


def rbox(o, size, r=1.0, shade=1.0, rng=None, top_detail=None):
    """A box with rounded vertical edges, the way a machined or moulded part is.
    The sides get short vertical strokes crowding toward the shadow, like the
    engraved chips; shade scales how many."""
    x, y, z = o
    w, d, h = size
    ring = rounded_rect(x + w / 2, y + d / 2, w, d, r)
    top = [P((a, b, z + h)) for a, b in ring]
    bot = [P((a, b, z)) for a, b in ring]
    hull = MultiPoint(top + bot).convex_hull
    lines = [top + [top[0]]]
    # side strokes: at each perimeter sample facing the viewer, a vertical line
    # whose spacing follows how far the surface turns from the light
    per = LineString(ring + [ring[0]])
    L = per.length
    step = max(0.35, 0.9 / max(shade, 0.05))
    t = 0.0
    while t < L:
        p0 = per.interpolate(t)
        p1 = per.interpolate(min(t + 0.05, L))
        tx, ty = p1.x - p0.x, p1.y - p0.y
        nrm = norm((ty, -tx, 0))
        if dot(nrm, VIEW) > 0.05:
            dark = 1 - max(0.0, dot(nrm, LIGHT))
            if dark > 0.62 and rng is not None and rng.random() < (dark - 0.5) * 2 * shade:
                frac = 0.15 + 0.35 * dark * (rng.uniform(0.5, 1.0))
                lines.append([P((p0.x, p0.y, z)), P((p0.x, p0.y, z + h * frac))])
            t += step * (1.4 - dark)
        else:
            t += step
    if top_detail:
        lines += top_detail
    return lines, hull


def contour_cylinder(c0, c1, r, rings=12, bands=(), shade=1.0, rng=None, n=72):
    """A cylinder shaded like the thruster: many contour rings crowding toward
    its ends and bands, plus generator strokes on the shadow side."""
    a, u, v = perp_frame(sub(c1, c0))
    cap0 = circle3(c0, u, v, r, n)
    cap1 = circle3(c1, u, v, r, n)
    hull = MultiPoint(cap0 + cap1).convex_hull
    facing = cap1 if dot(a, VIEW) > 0 else cap0
    lines = [facing]

    def half_ring(c, rr=r):
        seg, segs = [], []
        for i in range(n + 1):
            t = 2 * math.pi * i / n
            nrm = add(mul(u, math.cos(t)), mul(v, math.sin(t)))
            if dot(nrm, VIEW) > 0:
                seg.append(P(add(c, add(mul(u, rr * math.cos(t)), mul(v, rr * math.sin(t))))))
            elif seg:
                segs.append(seg)
                seg = []
        if seg:
            segs.append(seg)
        return [q for q in segs if len(q) > 1]

    marks = sorted(set([0.0, 1.0] + list(bands)))
    for m in bands:
        lines += half_ring(lerp(c0, c1, m))
        for k in (0.015, 0.03):
            for mm in (m - k, m + k):
                if 0 < mm < 1:
                    lines += half_ring(lerp(c0, c1, mm))
    for i in range(rings):
        f = (i + 1) / (rings + 1)
        # crowd toward both ends
        g = 0.5 - 0.5 * math.cos(math.pi * f)
        g = g ** 1.6 if i < rings / 2 else 1 - (1 - g) ** 1.6
        lines += half_ring(lerp(c0, c1, g))
    mid = math.atan2(dot(v, VIEW), dot(u, VIEW))
    at = lambda t: add(mul(u, r * math.cos(t)), mul(v, r * math.sin(t)))
    side = 1 if P(at(mid + math.pi / 2))[0] > P(at(mid - math.pi / 2))[0] else -1
    k = int(10 * shade)
    for i in range(k):
        t = mid + side * (0.5 + (math.pi / 2 - 0.55) * (i / max(k - 1, 1)) ** 0.7)
        f0 = rng.uniform(0.0, 0.2) if rng else 0.0
        f1 = rng.uniform(0.8, 1.0) if rng else 1.0
        lines.append([P(add(lerp(c0, c1, f0), at(t))), P(add(lerp(c0, c1, f1), at(t)))])
    return lines, hull


def bolt_circle(c, u, v, R, count, r=0.45):
    """Bolt heads around a flange: small ellipses on the flange face."""
    out = []
    for k in range(count):
        t = 2 * math.pi * k / count
        bc = add(c, add(mul(u, R * math.cos(t)), mul(v, R * math.sin(t))))
        out.append(circle3(bc, u, v, r, 16))
    return out


def tube(path3, r, n=16, shading=True):
    """A cable, bar or casting along a 3D path: its silhouette, occluding what's
    behind it, and (with shading) a line along its shadow side."""
    pts = [P(p) for p in path3]
    line = LineString(pts)
    body = line.buffer(r, cap_style=1, quad_segs=4)
    lines = []
    L = line.length
    if not shading:
        return lines, body
    # a shading line along the lower side
    off = []
    for i in range(0, 101):
        a = line.interpolate(L * i / 100)
        b = line.interpolate(min(L * i / 100 + 0.1, L))
        dx, dy = b.x - a.x, b.y - a.y
        ln = math.hypot(dx, dy) or 1
        off.append((a.x - dy / ln * r * 0.45, a.y + dx / ln * r * 0.45))
    lines.append(off)
    return lines, body


def rslab(o, ex, ey, ez, w, d, h, r=1.0, shade=0.5, rng=None):
    """A rounded slab in any orientation: a rounded rectangle w x d in the
    ex, ey plane, extruded h along ez. For lids, sheets and panels at an angle."""
    ring = rounded_rect(w / 2, d / 2, w, d, r)
    W = lambda a, b, c: add(o, add(mul(ex, a), add(mul(ey, b), mul(ez, c))))
    cap0 = [P(W(a, b, 0)) for a, b in ring]
    cap1 = [P(W(a, b, h)) for a, b in ring]
    hull = MultiPoint(cap0 + cap1).convex_hull
    facing = cap1 if dot(ez, VIEW) > 0 else cap0
    lines = [facing + [facing[0]]]
    if rng is not None and shade > 0:
        per = LineString(ring + [ring[0]])
        t, L = 0.0, per.length
        while t < L:
            p0, p1 = per.interpolate(t), per.interpolate(min(t + 0.05, L))
            n = norm(add(mul(ex, p1.y - p0.y), mul(ey, -(p1.x - p0.x))))
            dark = 1 - max(0.0, dot(n, LIGHT))
            if dot(n, VIEW) > 0.05 and dark > 0.62 and rng.random() < (dark - 0.5) * 2 * shade:
                lines.append([P(W(p0.x, p0.y, 0)), P(W(p0.x, p0.y, h * (0.15 + 0.35 * dark * rng.uniform(0.5, 1))))])
            t += 0.5
    return lines, hull


def plane_pts(o, ex, ey, pts2):
    """2D points in a plane's own units (along ex, ey from o), to screen."""
    return [P(add(o, add(mul(ex, a), mul(ey, b)))) for a, b in pts2]


# ── Blueprint details ────────────────────────────────────────────────────────


def section(poly, spacing=0.45):
    """45 degree section hatching on a cut face, the blueprint convention for
    material that has been cut through."""
    return [list(poly.exterior.coords)] + hatch(poly.buffer(-0.05), 45, spacing)


def screw(c, u, v, r=0.6, slot=True):
    """A screw head seen on a face: a ring, an inner ring, and a cross slot."""
    out = [circle3(c, u, v, r, 20), circle3(c, u, v, r * 0.65, 16)]
    if slot:
        for a in (0.6, 0.6 + math.pi / 2):
            d = add(mul(u, math.cos(a) * r * 0.55), mul(v, math.sin(a) * r * 0.55))
            out.append([P(sub(c, d)), P(add(c, d))])
    return out


def knurl(c0, c1, r, count=24, n=72):
    """Lines along a cylinder's visible half, evenly spaced around it."""
    a, u, v = perp_frame(sub(c1, c0))
    out = []
    for k in range(count):
        t = 2 * math.pi * k / count
        nrm = add(mul(u, math.cos(t)), mul(v, math.sin(t)))
        if dot(nrm, VIEW) > 0.12:
            off = mul(nrm, r)
            out.append([P(add(c0, off)), P(add(c1, off))])
    return out


def disc(c, u, v, r, r_in=0.0, a0=0.0, a1=2 * math.pi, n=60):
    """A flat plate (a full or partial disc, optionally with a hole) in the
    plane u, v at c: lines and its screen occluder."""
    outer = [add(c, add(mul(u, r * math.cos(a0 + (a1 - a0) * i / n)), mul(v, r * math.sin(a0 + (a1 - a0) * i / n)))) for i in range(n + 1)]
    if a1 - a0 < 2 * math.pi - 1e-6:
        pts = outer + ([add(c, add(mul(u, r_in * math.cos(a1 - (a1 - a0) * i / n)), mul(v, r_in * math.sin(a1 - (a1 - a0) * i / n)))) for i in range(n + 1)] if r_in else [c])
    else:
        pts = outer
    scr = [P(p) for p in pts]
    poly = Polygon(scr).buffer(0)
    lines = [scr + [scr[0]]]
    if r_in and a1 - a0 >= 2 * math.pi - 1e-6:
        inner = circle3(c, u, v, r_in, n)
        lines.append(inner)
        poly = poly.difference(Polygon(inner))
    return lines, poly
