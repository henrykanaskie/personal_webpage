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
    def __init__(self, mirror=False, seed=1):
        self.items = []
        self.mirror = mirror
        self.rng = random.Random(seed)

    def add(self, lines, occluder=None, group=None):
        """lines: screen polylines; occluder: screen polygon hiding what's behind."""
        self.items.append((lines, occluder, group))

    def render(self):
        hidden = None
        out = []
        for lines, occluder, group in reversed(self.items):
            visible = []
            for pts in lines:
                if len(pts) < 2:
                    continue
                g = LineString(pts)
                if g.length < 1e-6:
                    continue
                if hidden is not None:
                    g = g.difference(hidden)
                visible += [c for c in lines_of(g) if LineString(c).length > 0.25]
            out.append((group, visible))
            if occluder is not None and not occluder.is_empty:
                occluder = occluder.buffer(0)
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
        for k in order:
            if not groups[k]:
                continue
            d = " ".join(
                "M " + " L ".join(f"{sx * x:.2f} {y:.2f}" for x, y in ln) for ln in groups[k]
            )
            body.append(f'<path stroke="#000000" d="{d}"/>')
        with open(path, "w") as f:
            f.write(
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.2f} {vb[1]:.2f} {vb[2]:.2f} {vb[3]:.2f}">\n'
                f'<g fill="none" stroke-width="{max(vb[2], vb[3]) / 650:.3f}" stroke-linecap="round" stroke-linejoin="round">\n'
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
