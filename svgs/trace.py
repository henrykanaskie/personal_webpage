"""Traces a line-art image (PNG/JPG) into svgs/svg_data/<name>.svg, ready for
convert.py, the same kind of file the site's traced drawings are.

    python3 svgs/trace.py acclimate ~/Downloads/hard-drive.png
    python3 svgs/convert.py acclimate

The tracer outlines the ink: each pen stroke becomes a thin closed contour
around it, which the site then strokes, so heavy lines stay heavy and fine
hatching stays fine. Needs vtracer (pip install vtracer).
"""

import re
import sys
from pathlib import Path

import vtracer

OUT = Path(__file__).resolve().parent / "svg_data"


def trace(name, image, speckle=6):
    out = OUT / f"{name}.svg"
    vtracer.convert_image_to_svg_py(
        str(image), str(out),
        colormode="binary",   # ink or paper: gray tones would trace as contour noise
        mode="spline",        # smooth curves, like the drawings on the site
        filter_speckle=speckle,  # drop specks smaller than this many pixels
        corner_threshold=60,
        length_threshold=4.0,
        splice_threshold=45,
        path_precision=2,
    )
    # stroke the outlines rather than fill them, as the other sources are
    svg = out.read_text()
    svg = re.sub(r'fill="[^"]*"', 'fill="none" stroke="#000000"', svg)
    out.write_text(svg)
    return out, len(re.findall(r"<path", svg))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    path, n = trace(sys.argv[1], sys.argv[2], *(int(a) for a in sys.argv[3:4]))
    print(f"wrote {path.relative_to(Path.cwd()) if path.is_relative_to(Path.cwd()) else path}: {n} paths")
