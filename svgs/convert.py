"""Turns a traced line drawing (svgs/svg_data/<name>.svg) into the path list the
site draws (svgs/<name>Paths.ts), and writes a preview to judge it by.

    python3 svgs/convert.py acclimate          # convert one drawing
    python3 svgs/convert.py --all              # every drawing with a source
    python3 svgs/convert.py --check            # shipped files match the manifest?
    python3 svgs/convert.py acclimate --keep 90      # pin a path count
    python3 svgs/convert.py acclimate --repin        # re-pick it from the budget

Trimming: outlines are ranked by size (the tracer's long ones are the
silhouette and major parts, its short ones hatching and specks) and the
largest are kept, in drawing order. An outline is one moveto in a path: the
tracer packs thousands into a few paths, so trimming whole paths kept or cut
most of a drawing at once. How many to keep is decided once and pinned in
svgs/drawings.json, so a rerun always gives the same file. A new drawing gets
the most outlines that fit its byte budget, after rounding coordinates to
`precision` decimals (0.1 of a unit is far below a pixel at card size) and
dropping the spaces a path doesn't need. Entries with "precision": null are
the original drawings, kept exactly as they were first converted (whole
paths, full precision).
"""

import argparse
import gzip
import math
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "drawings.json"
SOURCES = ROOT / "svg_data"
PREVIEWS = ROOT / "preview"

NUMBER = re.compile(r"-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")

# Report thresholds, calibrated on the drawings already on the site. Trimmed
# to 400 KB, the truck and satellite still read at card size with about 20% of
# their linework, so share alone says little; the thumbnail is the real test.
SPARSE_SHARE = 0.15
# Most <path> elements a drawing may have: each one animates on its own.
MAX_PATHS = 400
DENSE_SOURCE = 5000


def load_manifest():
    return json.loads(MANIFEST.read_text())


def save_manifest(manifest):
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")


def source_paths(name):
    svg = (SOURCES / f"{name}.svg").read_text()
    return [" ".join(d.split()).strip() for d in re.findall(r'<path[^>]*\bd="(.*?)"', svg, re.DOTALL)]


def compact(d, precision):
    """Rounds every number and drops whitespace a path parser doesn't need."""

    def rounded(m):
        s = f"{float(m.group()):.{precision}f}"
        if "." in s:
            s = s.rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s

    d = NUMBER.sub(rounded, d)
    d = re.sub(r"\s*([A-Za-z])\s*", r"\1", d)
    return re.sub(r"\s+-", "-", d).strip()


def split(d):
    """A path's outlines: it breaks at each absolute moveto. A path with a
    relative one stays whole, as its outlines depend on the one before."""
    if "m" in d:
        return [d]
    return [s for s in re.split(r"(?=M)", d) if s.strip()]


def pick_keep(units, budget_kb):
    """The most units, largest first, that fit in the byte budget."""
    total = 0
    for n, size in enumerate(sorted((len(u) for _, u in units), reverse=True)):
        total += size
        if total > budget_kb * 1024:
            return max(n, 1)
    return len(units)


def trim(units, keep, per_path=None):
    """Keeps the largest units, rejoined into their paths in drawing order.
    per_path splits a path's kept outlines into groups of that many: the site
    animates each path drawing itself, and a tracer packs hundreds of outlines
    into one path, which would draw a whole region in a single stroke."""
    ranked = sorted(range(len(units)), key=lambda i: len(units[i][1]), reverse=True)
    top = set(ranked[:keep])
    kept = {}
    for i, (parent, unit) in enumerate(units):
        if i in top:
            kept.setdefault(parent, []).append(unit)
    if not per_path:
        return ["".join(parts) for parts in kept.values()]
    # Group outlines in drawing order, across paths: a tracer may make every dash
    # its own path, and thousands of animated <path> elements on one card is a
    # scroll freeze. At least per_path outlines per path, at most MAX_PATHS paths.
    flat = [u for parts in kept.values() for u in parts]
    n = max(per_path, math.ceil(len(flat) / MAX_PATHS))
    return ["".join(flat[i:i + n]) for i in range(0, len(flat), n)]


def render_ts(name, kept):
    lines = [f'  "{p}"{"," if i < len(kept) - 1 else ""}\n' for i, p in enumerate(kept)]
    return f"export const {name}Paths = [\n" + "".join(lines) + "];\n"


def build(name, entry, defaults):
    """Returns (ts source, kept paths, report lines); fills in entry["keep"] if unset."""
    precision = entry.get("precision", defaults["precision"])
    paths = source_paths(name)
    if precision is None:
        units = list(enumerate(paths))
    else:
        units = [(i, s) for i, p in enumerate(paths) for s in split(compact(p, precision))]
    if entry.get("keep") is None:
        entry["keep"] = pick_keep(units, entry.get("budget_kb", defaults["budget_kb"]))
    kept = trim(units, entry["keep"], None if precision is None else 4)
    ts = render_ts(name, kept)

    share = sum(map(len, kept)) / max(sum(len(u) for _, u in units), 1)
    raw_kb = len(ts.encode()) / 1024
    gz_kb = len(gzip.compress(ts.encode())) / 1024
    report = [
        f"{name}: kept {min(entry['keep'], len(units))} of {len(units)} outlines in {len(kept)} paths,"
        f" {share:.0%} of the linework",
        f"  {raw_kb:.0f} KB ({gz_kb:.0f} KB gzipped), precision {precision}",
    ]
    budget = entry.get("budget_kb", defaults["budget_kb"])
    if raw_kb > budget * 1.05 and precision is not None:
        report.append(f"  ! over the {budget} KB budget: lower keep, or simplify the drawing")
    if share < SPARSE_SHARE:
        report.append("  ! sparse: most of the linework is cut. Check the thumbnail; if it no longer reads,"
                      " regenerate with fewer parts rather than raising keep")
    if len(paths) > DENSE_SOURCE:
        report.append("  ! dense source: the trace is mostly hatching and specks (usually gray fills in the image)."
                      " Regenerate with flatter line art")
    if len(kept) < 20:
        report.append(f"  ! only {len(kept)} paths: the drawing will draw itself in a few strokes, not line by line")
    return ts, kept, report


def write_preview(name, kept):
    PREVIEWS.mkdir(exist_ok=True)
    group = "".join(f'<path d="{p}"/>' for p in kept)
    source = f"../svg_data/{name}.svg"
    has_source = (SOURCES / f"{name}.svg").exists()
    figure = lambda cls, px: (
        f'<figure class="{cls}"><svg width="{px}" height="{px}">'
        f'<g fill="none" stroke-width="1" vector-effect="non-scaling-stroke">{group}</g></svg>'
        f"<figcaption>{px}px</figcaption></figure>"
    )
    html = f"""<!doctype html><meta charset="utf-8"><title>{name}: trimmed drawing</title>
<style>
body{{margin:0;font:13px system-ui;background:#888;display:grid;grid-template-columns:1fr 1fr;gap:1px}}
section{{padding:24px;display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}}
.light{{background:#f4f3ef;color:#555}} .dark{{background:#101113;color:#aaa}}
.light path{{stroke:#4a4d52}} .dark path{{stroke:#c9ccd1}}
figure{{margin:0}} figcaption{{margin-top:6px}}
svg path{{vector-effect:non-scaling-stroke}} img{{width:420px;background:#fff}}
h2{{width:100%;margin:0;font-size:13px;font-weight:600}}
</style>
<section class="light"><h2>What the site draws ({len(kept)} paths), light sheet. The thumbnail is card-corner size: can you tell what it is?</h2>
{figure("", 140)}{figure("", 420)}</section>
<section class="dark"><h2>Dark sheet</h2>{figure("", 140)}{figure("", 420)}</section>
<section class="light" style="grid-column:1/-1"><h2>Full source trace, for comparison</h2>
{f'<img src="{source}">' if has_source else "<p>No source SVG for this drawing.</p>"}</section>
<script>
for (const svg of document.querySelectorAll("svg")) {{
  const b = svg.firstElementChild.getBBox();
  svg.setAttribute("viewBox", `${{b.x}} ${{b.y}} ${{b.width}} ${{b.height}}`);
}}
</script>
"""
    out = PREVIEWS / f"{name}.html"
    out.write_text(html)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("names", nargs="*")
    ap.add_argument("--all", action="store_true", help="convert every drawing that has a source")
    ap.add_argument("--check", action="store_true", help="verify shipped files match the manifest; write nothing")
    ap.add_argument("--keep", type=int, help="pin this many paths")
    ap.add_argument("--budget", type=int, help="byte budget in KB for this drawing")
    ap.add_argument("--repin", action="store_true", help="forget the pinned count and re-pick it from the budget")
    args = ap.parse_args()

    manifest = load_manifest()
    defaults, drawings = manifest["defaults"], manifest["drawings"]
    names = args.names or []
    if args.all or args.check:
        names = [n for n, e in drawings.items() if (SOURCES / f"{n}.svg").exists()]
    if not names:
        ap.error("name a drawing, or pass --all / --check")

    failed = False
    for name in names:
        if not re.fullmatch(r"[a-z][A-Za-z0-9]*", name):
            sys.exit(f"{name}: use a camelCase name (it becomes {name}Paths)")
        if not (SOURCES / f"{name}.svg").exists():
            sys.exit(f"{name}: no source at {SOURCES / (name + '.svg')}")
        entry = drawings.setdefault(name, {})
        if args.budget is not None:
            entry["budget_kb"] = args.budget
        if args.keep is not None:
            entry["keep"] = args.keep
        elif args.repin:
            entry["keep"] = None

        ts, kept, report = build(name, entry, defaults)
        target = ROOT / f"{name}Paths.ts"
        if args.check:
            ok = target.exists() and target.read_text() == ts
            failed |= not ok
            print(f"{name}: {'matches' if ok else 'DIFFERS from the manifest'}")
            continue
        target.write_text(ts)
        print("\n".join(report))
        print(f"  wrote {target.relative_to(ROOT.parent)}, preview {write_preview(name, kept).relative_to(ROOT.parent)}")

    if args.check:
        sys.exit(1 if failed else 0)
    save_manifest(manifest)


if __name__ == "__main__":
    main()
