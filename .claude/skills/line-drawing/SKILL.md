---
name: line-drawing
description: Design the technical line drawing for a project or experience card on the CS page, from its description to a finished spec and image prompt, then take the traced SVG through trimming into the site. Use when the user wants art for a project, a new drawing, a replacement for placeholder art, or runs /line-drawing <project title or description>.
---

# Line drawing pipeline

Input: a project or experience title from `app/cs/content.ts`, or a description
pasted by the user. Output: a spec at `svgs/specs/<name>.md` holding the image
prompt, and, once the user has a traced SVG, `svgs/<name>Paths.ts` wired into
the card.

The standard is the drawings already on the site. The bee is not a bee: it's a
bee made of machinery (a gear train in a glass abdomen, a circuit-board thorax,
rocket nozzles). The neural net is not a picture about learning: it is the
network, drawn as an engraving plate. So:

> **Draw the project's actual mechanism, made physical.** Either a real object
> with its computation built into it, or the project's own diagram drawn as an
> engineering plate. Never a metaphor that only gestures at the topic (a
> compass for "navigating code", a book for "knowledge").

The test: someone who has read the card could point at each part of the drawing
and name the claim in the description it stands for.

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

Sketch three concepts in a sentence or two each, at least one of each kind:

- **Machine**: a physical object whose parts are the computation (the bee).
- **Plate**: the project's own diagram or pipeline drawn as an exploded
  engineering assembly (the network).

For each, a part map: every major part → the claim it depicts. A part with no
claim is decoration; cut it.

## 3. Score

Score each concept 0-2 on each line, and pick the highest. Revise and rescore
if the best is under 10 of 12.

| | 0 | 2 |
|---|---|---|
| **Specific** | could illustrate any project in the field | at least two parts only this project would have |
| **Silhouette** | needs the detail to be recognised | recognisable from its outline at 140px |
| **Part budget** | 6+ major parts | 3-4 major parts plus the signature detail |
| **Traceable** | needs text, tone, gradients, photo realism or big solid areas | pure line work and hatching |
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
Concept: <machine|plate>: <one line>

## Claims → parts
| Claim (from the description) | Part |

## Signature detail
<the part that carries the most specific claim, and why it must survive>

## Cut order
<parts to drop first if the thumbnail doesn't read, most expendable first;
the signature detail is never on it>

## Prompt
<style block from svgs/specs/STYLE.md, verbatim>
<orientation line for the column>
<subject block>
```

Write the subject block in this order, since image models weight what comes
first: **silhouette and pose → the cutaway or exploded structure → the parts,
each as a physical thing with its shape, count and placement → the signature
detail, described precisely → `Avoid:` list.** Describe shapes, never
concepts: not "showing data flowing" but "a flat ribbon of tape carrying small
rectangular blocks". Every avoid list includes readable text, and whatever
cliché the topic invites (money for finance, a brain for ML, a robot for
agents, weapons for defense).

## 5. Image and trace (the user does this)

Hand the user the prompt and these steps:

1. Generate four candidates at 2048px or more, all with the same model and
   settings as the other drawings. Pick the one with the cleanest outline, not
   the most detail.
2. Thumbnail test before tracing: shrink it to 140px. If it doesn't read, cut
   the next part on the cut order and regenerate. More detail never fixes it.
3. Trace it to SVG with the same tracer and settings as the existing drawings
   (stroked outlines, few tones). Save it as `svgs/svg_data/<name>.svg`.

Or draw it in code instead: `svgs/draw/scenes.py` holds one function per
drawing, built from the isometric kit in `svgs/draw/iso.py` (solids,
cylinders, hatching, stipple, pixel sprites, hidden-line removal). Code-drawn
art is clean and diagrammatic rather than engraved, and a fraction of the
size; it suits plate concepts best. `python3 svgs/draw/scenes.py <name>`
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
  doesn't read; then simplify the drawing (cut order), don't raise the budget.
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
