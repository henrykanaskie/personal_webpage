"""Traces a line drawing (PNG, JPG, or an SVG from an image tool) into
svgs/svg_data/<name>.svg, ready for convert.py, the same kind of file the
site's traced drawings are.

    python3 svgs/trace.py acclimate ~/Downloads/hard-drive.png
    python3 svgs/trace.py acclimate art.svg --ink 200
    python3 svgs/convert.py acclimate

The image is reduced to clean ink and paper first, aiming for a clean drawing
rather than a pixel-faithful copy:

- Hysteresis: a stroke is ink if it is darker than --ink (default 190) *and*
  connects to some genuinely dark ink (darker than --strong, default 120). Real
  lines keep their full anti-aliased width; faint marks that only half cross
  the threshold (wallpaper, grain, washes) drop out whole instead of leaving
  broken fragments.
- Specks: blobs under MIN_AREA pixels go, unless they are dash-shaped, so
  dashed lines and rows of code survive while grit does not.

An SVG source (image tools often export one built from hundreds of filled
grey regions) is rasterised at 2048px first, so its tones go through the same
cleanup rather than tracing as region outlines.

The tracer outlines the ink: each pen stroke becomes a thin closed contour
around it, which the site then strokes, so heavy lines stay heavy and fine
hatching stays fine. Needs vtracer, Pillow, OpenCV and numpy, and for SVG input cairosvg.
"""

import argparse
import re
import tempfile
from pathlib import Path

import json

import cv2
import numpy as np
import vtracer
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent / "svg_data"
SETTINGS = Path(__file__).resolve().parent / "source_art" / "trace.json"
SIZE = 2048
# Ink threshold: pixels darker than this are ink. Thin pen lines anti-alias to
# mid grey, so it sits well above the middle; much higher and an image tool's
# grey shading (histogram bars, washes) fills in solid black.
INK = 190
# Specks smaller than this many pixels are dropped. Keep it small: a short dash
# (dashed guides, the dashed Gaussian, rows of code) is itself a tiny blob, and
# a filter of 6 deleted every one of them.
SPECKLE = 2
# Hysteresis: a stroke only counts if some of it is at least this dark.
STRONG = 120
# Blobs smaller than this are grit, unless dash-shaped (long and thin).
MIN_AREA = 24


def clean(gray, ink, strong, min_area=None, solidify=None):
    """Ink mask (True = ink) from a greyscale image, by hysteresis and speck
    removal; see the module docstring. solidify=(k, density) fills patches
    where more than `density` of a k x k window is ink: a mottled grey shade
    then traces as one clean silhouette instead of a cluster of grit."""
    min_area = MIN_AREA if min_area is None else min_area
    weak = (gray < ink).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(weak, connectivity=8)
    has_strong = np.zeros(n, bool)
    has_strong[np.unique(labels[gray < strong])] = True
    w, h, area = stats[:, cv2.CC_STAT_WIDTH], stats[:, cv2.CC_STAT_HEIGHT], stats[:, cv2.CC_STAT_AREA]
    long_side, short_side = np.maximum(w, h), np.maximum(np.minimum(w, h), 1)
    dash = (long_side >= 6) & (long_side >= 2.5 * short_side)
    keep = has_strong & ((area >= min_area) | dash)
    keep[0] = False  # the paper
    mask = keep[labels]
    if solidify:
        k, density = solidify
        dense = cv2.blur(mask.astype(np.float32), (k, k)) > density
        dense = cv2.morphologyEx(dense.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
        mask |= dense
    return mask


def drop_blobs(mask, boxes, k):
    """Removes each ink blob lying entirely inside one of the boxes ([x0, y0,
    x1, y1] in the source's 1024 frame). A blob that only crosses a box is
    kept, so a real edge next to a stray mark can't be clipped."""
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    x, y, w, h = (stats[:, i] for i in (cv2.CC_STAT_LEFT, cv2.CC_STAT_TOP, cv2.CC_STAT_WIDTH, cv2.CC_STAT_HEIGHT))
    gone = np.zeros(n, bool)
    for x0, y0, x1, y1 in boxes:
        gone |= (x >= x0 * k) & (y >= y0 * k) & (x + w <= x1 * k) & (y + h <= y1 * k)
    gone[0] = False
    return mask & ~gone[labels]


def to_ink(image, ink, erase=(), strong=None, min_area=None, solidify=None, drop=()):
    """A pure black-on-white PNG of the image's ink, at SIZE on its long side.
    erase: polygons, in the source's own 1024 frame, painted out first (to drop
    a part of the drawing that shouldn't ship)."""
    src = Path(image)
    if src.suffix.lower() == ".svg":
        import cairosvg

        raw = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
        cairosvg.svg2png(url=str(src), write_to=raw, output_width=SIZE, output_height=SIZE, background_color="white")
        img = Image.open(raw)
    else:
        img = Image.open(src)
    img = img.convert("RGBA")
    paper = Image.new("RGBA", img.size, "white")
    img = Image.alpha_composite(paper, img).convert("L")
    scale = SIZE / max(img.size)
    if scale > 1:
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    if erase:
        k = img.width / FRAME
        pen = ImageDraw.Draw(img)
        for poly in erase:
            pen.polygon([(x * k, y * k) for x, y in poly], fill=255)
    mask = clean(np.asarray(img), ink, strong if strong is not None else STRONG, min_area, solidify)
    if drop:
        mask = drop_blobs(mask, drop, img.width / FRAME)
    bw = Image.fromarray(np.where(mask, 0, 255).astype(np.uint8), mode="L")
    out = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
    bw.save(out)
    return out


NUMBER = re.compile(r"-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


# The site draws every drawing in its own coordinates inside AnimatedSvg's fixed
# viewBox, so all sources share one frame: a 1024 square, the size the original
# drawings were traced at. Tracing happens at SIZE for detail, then scales back.
FRAME = 1024


def bake_translate(m):
    """vtracer places each path with transform="translate(x,y)"; move the points
    instead, and scale them from the trace's SIZE into the shared FRAME. Its
    paths use only absolute M, L, C and Q (pairs of x, y) and Z."""
    tag = m.group(0)
    t = re.search(r'transform="translate\(([-\d.eE]+)[ ,]+([-\d.eE]+)\)"', tag)
    tx, ty = (float(t.group(1)), float(t.group(2))) if t else (0.0, 0.0)
    k = FRAME / SIZE
    d = re.search(r'\bd="([^"]*)"', tag).group(1)
    if re.search(r"[a-yA-Y]", re.sub(r"[MLCQZ]", "", d)):
        raise ValueError("path uses commands other than absolute M/L/C/Q/Z; can't bake its translate")
    i = iter(range(10 ** 9))
    moved = NUMBER.sub(lambda n: f"{(float(n.group()) + (tx if next(i) % 2 == 0 else ty)) * k:.2f}", d)
    tag = tag.replace(d, moved, 1)
    return re.sub(r'\s*transform="[^"]*"', "", tag)


# Where the drawing sits in the frame: the box the site's other drawings occupy
# (measured: the network, thruster, drones, FPGA and truck all span roughly
# x 100-920, y 45-540 of their 1024 frame). Card placement (corner, size,
# offset) assumes it, so a new drawing fitted here needs no per-card tuning.
BOX = (100.0, 45.0, 820.0, 495.0)  # x, y, width, height


def fit_to_box(svg):
    """Scales and moves every path so the drawing fills BOX, keeping its aspect
    ratio, centred across and aligned to the top, like the other drawings."""
    ds = re.findall(r'\bd="([^"]*)"', svg)
    xs, ys = [], []
    for d in ds:
        nums = [float(n) for n in NUMBER.findall(d)]
        xs += nums[0::2]
        ys += nums[1::2]
    x0, y0 = min(xs), min(ys)
    w, h = max(xs) - x0, max(ys) - y0
    bx, by, bw, bh = BOX
    k = min(bw / w, bh / h)
    ox = bx + (bw - w * k) / 2

    def move(m):
        i = iter(range(10 ** 9))
        return 'd="' + NUMBER.sub(
            lambda n: f"{((float(n.group()) - x0) * k + ox) if next(i) % 2 == 0 else ((float(n.group()) - y0) * k + by):.2f}",
            m.group(1)) + '"'

    return re.sub(r'\bd="([^"]*)"', move, svg)


def settings(name):
    """This drawing's saved trace settings (ink threshold, erase polygons)."""
    if SETTINGS.exists():
        return json.loads(SETTINGS.read_text()).get(name, {})
    return {}


def trace(name, image, ink=None, speckle=SPECKLE):
    out = OUT / f"{name}.svg"
    cfg = settings(name)
    ink = ink if ink is not None else cfg.get("ink", INK)
    vtracer.convert_image_to_svg_py(
        to_ink(image, ink, cfg.get("erase", ()), cfg.get("strong"), cfg.get("min_area"), cfg.get("solidify"), cfg.get("drop", ())), str(out),
        colormode="binary",
        mode="polygon",          # straight runs: a fifth the bytes of splines, so the
                                 # trim can keep every outline (fine lines are holes in
                                 # the ink, and they are the first a byte budget drops)
        filter_speckle=speckle,  # drop specks smaller than this many pixels
        corner_threshold=60,
        length_threshold=4.0,
        splice_threshold=45,
        path_precision=2,
    )
    # stroke the outlines rather than fill them, as the other sources are, and
    # bake each path's translate into its points: convert.py reads only `d`
    svg = out.read_text()
    svg = re.sub(r'<path\b[^>]*>', bake_translate, svg)
    svg = fit_to_box(svg)
    svg = re.sub(r'fill="[^"]*"', 'fill="none" stroke="#000000"', svg)
    svg = re.sub(r'<svg([^>]*?) width="\d+" height="\d+"', rf'<svg\1 width="{FRAME}" height="{FRAME}" viewBox="0 0 {FRAME} {FRAME}"', svg, count=1)
    out.write_text(svg)
    return out, len(re.findall(r"<path", svg))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("name")
    ap.add_argument("image")
    ap.add_argument("--ink", type=int, default=None, help=f"pixels darker than this are ink (0-255); default {INK}, or the drawing's saved setting")
    ap.add_argument("--speckle", type=int, default=SPECKLE, help="drop specks smaller than this many pixels")
    a = ap.parse_args()
    path, n = trace(a.name, a.image, a.ink, a.speckle)
    print(f"wrote svgs/svg_data/{path.name}: {n} paths")
