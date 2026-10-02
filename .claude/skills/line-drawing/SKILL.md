---
name: line-drawing
description: Design the technical line drawing for a project or experience card on the CS page, from its description to a finished spec and image prompt, then take the traced SVG through trimming into the site. Use when the user wants art for a project, a new drawing, a replacement for placeholder art, or runs /line-drawing <project title or description>.
---

# Line drawing pipeline

Input: a project or experience title from `app/cs/content.ts`, or a description
pasted by the user. Output: a spec at `svgs/specs/<name>.md` holding the image
prompt, and, once the user has a traced SVG, `svgs/<name>Paths.ts` wired into
the card.

The standard is the drawings already on the site, and each shows **what the
work actually is, as it is today**:

- **Hardware work → the real, modern hardware**, accurately: the Freightliner
  truck for Daimler, the Hall thruster for the propulsion lab, the FPGA package
  for the DSP work.
- **Software → the project's own core structure, drawn as a technical plate**,
  the way the neural network drawing is the network itself, in three
  dimensions, with stippled and hatched solid geometry.

> **One subject that is the project itself.** No metaphor (a compass for
> "navigating code"), no vintage stand-in (a typewriter for a language model),
> no scene. Its details carry the specifics.

Worked examples (specs in `svgs/specs/`): AccliMate is the repository's
dependency graph with one file opened to three cited lines; GPT From Scratch is
the transformer's four stacked blocks with the top one exploded; Monte Carlo is
the fan of simulated paths ending in a histogram whose tail runs past the
Gaussian; Cap Match is the RF board with four matched capacitors in a bridge
beside the reel they came from; smallsh is the shell's process tree with a
signal routed to the foreground job; Sprite Room is a MacBook Pro with the
pixel room dropping from its notch.

Everything must survive being a pen sketch traced to outlines: opaque parts
defined by edges, insides shown by cutaways. No glass, transparency, light,
glow or smoke.

The test: someone who knows the project recognises it at 140px, and someone who
has read the card can point at the detail that makes it this project.

## 1. Claims

Read the card's description (and `techStack`, `extraInfo`). List 4 to 8
**claims**: concrete mechanisms, stages, design decisions or results the text
actually states, quoted or closely paraphrased. "Chunked by AST rather than line
count" is a claim; "helps developers" is not. The drawing may only depict
claims on this list. If the description has fewer than 3 concrete claims (the
Daimler card, for now), stop and tell the user the card needs a real
description first; don't invent work.

Mark the one claim that is most specific to this project (what someone would
brag about in an interview). That becomes the **signature detail**.

## 2. Three concepts

Sketch three concepts in a sentence or two each. Each is the project itself:
for hardware work, the actual modern hardware; for software, its core structure
(the architecture, the data structure, the process, the output) drawn as a
technical plate. For each, name the subject, the detail that carries the
signature claim, and which other claims its details show.

## 3. Score

Score each concept 0-2 on each line, and pick the highest. Revise and rescore
if the best is under 10 of 12.

| | 0 | 2 |
|---|---|---|
| **Specific** | could illustrate any project in the field | at least two parts only this project would have |
| **Silhouette** | needs the detail to be recognised | recognisable from its outline at 140px |
| **Literal** | a metaphor, a vintage stand-in, or a scene | the project's own hardware or structure, as it is today |
| **Traceable** | needs text, tone, glass, transparency, light, glow, smoke or big solid areas | opaque parts defined by edges; insides shown by cutaways |
| **Family** | looks like clip art, or repeats a drawing already in `svgs/drawings.json` (two chips, two drones) | reads as another plate from the same book as the bee and the network |
| **Tone** | brains, robots, glow, money signs, weapons, lightning | precise, understated, engineered |

Tell the user the three concepts with their scores in a short table, and which
one you picked and why, before writing the spec. If two are close, let them
choose.

## 4. Spec

Write `svgs/specs/<name>.md` (`<name>` camelCase, it becomes `<name>Paths`),
in this shape:

```
# <Card title>
Card: <project|experience>, <left|right> column
Object: <the one or two objects>
Code-drawn version: `svgs/draw/scenes.py`, `<name>()` (if there is one)

## Claims → details
| Claim (from the description) | Detail on the object |

## Signature detail
<the detail that carries the most specific claim, and why it must survive>

## Prompt
<style block from svgs/specs/STYLE.md, verbatim>
<orientation line for the column>
<subject block>
```

Write the subject block in this order, since image models weight what comes
first: **the object and its pose → its major parts, each with shape, count and
placement → the cutaway, if any → the signature detail, described precisely →
`Avoid:` list.** Describe shapes, never
concepts: not "showing data flowing" but "a flat ribbon of tape carrying small
rectangular blocks". Every avoid list includes readable text, and whatever
cliché the topic invites (money for finance, a brain for ML, a robot for
agents, weapons for defense).

## 5. Image and trace (the user does this)

Hand the user the prompt and these steps:

1. Generate four candidates at 2048px or more, all with the same model and
   settings as the other drawings. Pick the one with the cleanest outline, not
   the most detail.
2. Thumbnail test before tracing: shrink it to 140px. If the object isn't
   recognisable, simplify it and regenerate. More detail never fixes it.
3. Keep the image tool's file in `svgs/source_art/<name>.svg` (or .png) and
   trace it: `python3 svgs/trace.py <name> svgs/source_art/<name>.svg`. It
   rasterises an SVG (image tools export hundreds of filled grey regions),
   keeps only ink (`--ink`, default 190), keeps specks down to 2px (dashes are specks), traces in polygons (a fifth the
   bytes of splines, so every fine line survives the trim), bakes the tracer's
   translates into the points, and fits the drawing into the box the site's
   other drawings occupy, so the card's corner, size and offset need no
   tuning. Aim for a clean drawing, not a pixel-exact copy: the tracer
   keeps faint strokes only where they connect to dark ink (hysteresis) and
   drops grit that isn't dash-shaped. Per-drawing settings live in
   `svgs/source_art/trace.json`: `ink`, `strong` (raise darkness demanded of a
   stroke, e.g. to drop a faint wallpaper), `min_area`, `solidify` ([k,
   density], fills mottled grey shading so it traces as one silhouette), `drop` boxes (removes only
   ink blobs lying wholly inside a box: the safe way to delete a stray mark
   next to a real edge), `paint` polygons (filled with ink after cleanup: rebuild a
   shape its hatching broke up, like the laptop's notch), `open` boxes (trim
   hairline protrusions inside a box; keep them away from thin real lines), and
   `erase` polygons (in the source's 1024 frame) for parts
   that shouldn't ship. Review each trace at full size for grit, broken half-lines and
   stray fragments, and tune that drawing's settings until it is clean. An image is the
   only route to the density of the bee and the chip.

Or draw it in code instead: `svgs/draw/scenes.py` holds one function per
drawing, built from the isometric kit in `svgs/draw/iso.py` (solids,
cylinders, hatching, stipple, pixel sprites, hidden-line removal). Code-drawn
art reads as a clean technical illustration rather than an engraving, and is
a fraction of the size; it suits machined, hard-edged objects best. `python3 svgs/draw/scenes.py <name>`
writes `svgs/svg_data/<name>.svg`, then continue below.

## 6. Trim and check

```
python3 svgs/convert.py <name>
```

This pins how much to keep in `svgs/drawings.json` (the most outlines that fit
the 400 KB budget, largest first), writes `svgs/<name>Paths.ts`, and writes
`svgs/preview/<name>.html` showing what the site will draw at card-corner size
and large, on both sheets, next to the full trace. Open the preview (or render
it with headless Chromium and look at it yourself) and judge the thumbnail. Act
on the report:

- **dense source**: the image had tones or fine hatching everywhere. Regenerate
  the image flatter; trimming can't recover a muddy trace.
- **sparse**: little of the linework survived. Only matters if the thumbnail
  doesn't read; then simplify the drawing, don't raise the budget.
- **only N paths**: the drawing will draw itself in a few strokes rather than
  line by line. Retrace with a tracer setting that separates outlines.
- Too heavy on the page: `--budget 300`. Pinned count wrong: `--keep N` or
  `--repin`.

`python3 svgs/convert.py --check` confirms every shipped path file still
matches the manifest; run it before committing.

## 7. Wire it in

In `app/cs/content.ts`, import `<name>Paths` and give the card its own entry in
place of the placeholder: for a project, `svgs: [{ paths: <name>Paths, corner,
size, rotate, offset, drawDuration }]` (corner matches the column); for an
experience, `svgPaths` and the `svg*` props. Start from the placeholder's
numbers and adjust by eye on the running page (`/run`).
