---
name: line-drawing
description: Design the technical line drawing for a project or experience card on the CS page, from its description to a finished spec and image prompt, then take the traced SVG through trimming into the site. Use when the user wants art for a project, a new drawing, a replacement for placeholder art, or runs /line-drawing <project title or description>.
---

# Line drawing pipeline

Input: a project or experience title from `app/cs/content.ts`, or a description
pasted by the user. Output: a spec at `svgs/specs/<name>.md` holding the image
prompt, and, once the user has a traced SVG, `svgs/<name>Paths.ts` wired into
the card.

The standard is the drawings already on the site: the rocket in cutaway, the
chip, the FPGA package, the thruster, the mechanical bee. Each is **one real
object**, drawn like a blueprint or patent plate in three-quarter view, bold
outline, fine detail, its working parts showing. None is a scene, a pipeline or
a diagram of boxes and arrows.

> **One picture, one or two concrete objects that stand for the whole project.**
> A real, recognisable piece of hardware, not a metaphor that only gestures at
> the topic (a compass for "navigating code") and not an abstract assembly of
> floating plates, trees and arrows. Its details carry the specifics.

The bar is **impressive engineering hardware**, the kind of object the rocket,
the thruster and the FPGA are: machined, dense with real parts, shown lid-off
or cut away so its insides read, with 45 degree section hatching on cut
surfaces. An everyday object (a microscope, a typewriter, a plain circuit
board) is too ordinary even when it fits; choose the more technical machine
that fits as well. Worked examples, all on the site:

- AccliMate: a hard drive with its lid off; the tracks are drawn as data and
  the head sits over one exact track, marked (the exact lines an answer cites).
- GPT From Scratch: an Enigma-style rotor machine; four rotors for the model's
  four blocks, one lamp lit for the next character.
- Monte Carlo: a Galton board; its ball piles run past the Gaussian printed on
  its back panel (the fat tail).
- Cap Match: an open RF tuner chassis; four identical air-variable capacitors
  set symmetrically and strapped into a bridge.
- smallsh: a Teletype ASR-33, the terminal Unix grew up on; prompts on the
  paper, punched tape out its side.
- Sprite Room: a laptop with its deck cut away to the logic board; the pixel
  room hangs from the notch on its screen.

The test: the object is recognisable at 140px, and someone who has read the
card can say why this object, and point at the detail that makes it this
project.

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

Sketch three concepts in a sentence or two each. Each is one or two real
objects (instruments, machines, devices, hardware), never a scene or a
pipeline. For each, name the object, the detail on it that carries the
signature claim, and which other claims its details show. Prefer objects with
hard, machined forms: they draw well both from an image model and in code.

## 3. Score

Score each concept 0-2 on each line, and pick the highest. Revise and rescore
if the best is under 10 of 12.

| | 0 | 2 |
|---|---|---|
| **Specific** | could illustrate any project in the field | at least two parts only this project would have |
| **Silhouette** | needs the detail to be recognised | recognisable from its outline at 140px |
| **One object** | a scene, a pipeline, or floating parts joined by arrows | one or two real objects, nothing floating |
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
3. Trace it: `python3 svgs/trace.py <name> <image>` writes
   `svgs/svg_data/<name>.svg` (vtracer, binary ink, spline curves, specks
   dropped; it reproduces the bee from a raster of it). An image is the only
   route to the density of the bee and the chip: thousands of hand-shaded
   contours, organic curves, texture. Code drawing can't reach that.

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
