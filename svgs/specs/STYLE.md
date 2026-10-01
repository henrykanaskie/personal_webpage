# Line drawing style block

Every image prompt starts with this block, verbatim, then the drawing's subject
block. Change it here only, and regenerate every drawing if you do: a drawing
made under an older style block will look like a different artist.

```
Hyper-detailed modern technical pen-and-ink drawing, like a contemporary engineering patent drawing or a cutaway in a current service manual. Drawn with a 0.1 mm technical pen in thin black lines of slightly varying weight; no thick outlines anywhere. The subject is accurate and current: real parts at true scale (screws, seams, connectors, components, cables), or for a diagram, every node and connection drawn precisely as solid geometry. Tone and form come only from dense, precise hatching, cross-hatching and stippling that follow each surface. Everything is opaque and defined by its edges: no glass, transparency, light, glow, reflections, smoke or motion effects; insides are shown by cutaways with hatched cut edges. Realistic three-quarter view from slightly above with gentle perspective. Black ink on pure white paper: no color, no gray wash, no gradients. One subject, centered, entirely in frame with a wide white margin. No readable text, letters or numbers; where text or code would appear, draw short dashes.
```

Then one orientation line, from the card's column:

- left column (art in the top-left corner): `The object faces toward the lower right.`
- right column (art in the top-right corner): `The object faces toward the lower left.`

## Session statement

For a chat-based generator (ChatGPT, Gemini), send this once at the start of the
conversation with a style reference attached, then send each drawing's object
paragraph on its own, one per message:

```
For every image in this conversation, follow these rules exactly. Match the drawing style of the attached reference image: its line weight, hatching and level of detail. Each image shows what a project actually is, as it is today: either a real, modern piece of hardware drawn accurately, or the project's own core structure drawn as a precise technical plate, the way the attached neural network diagram is the network itself. Nothing vintage, antique, steampunk or metaphorical. Draw it as a hyper-detailed modern technical pen-and-ink illustration, like a contemporary engineering patent drawing or a cutaway in a current service manual. Use a 0.1 mm technical pen: thin black lines of slightly varying weight, never thick outlines. Hardware has every real part at true scale: screws, seams, connectors, components, cables. Diagrams have every node and connection drawn as solid, precise geometry with stippled or hatched shading. Build tone and form only with dense, precise hatching, cross-hatching and stippling that follows each surface. Everything is opaque and defined by its edges: no glass, transparency, light, glow, reflections, smoke or motion effects; to show what is inside, cut the casing away with the cut edges hatched. Realistic three-quarter view from slightly above with gentle perspective. Black ink on pure white paper only: no color, no gray wash, no gradients, no background, no ground shadow, no border. One subject, centered, entirely in frame with a wide white margin. No readable text, letters, numbers, labels or logos; where text or code would appear, draw short dashes. Never cartoon, clip art, vector icon, flat design, coloring book, toy-like, simplified or 3D render. Square image. When I send a description, draw only that subject under these rules.
```

## Negative prompt

Where the tool has a separate field (Midjourney `--no`, Stable Diffusion, Leonardo), put this there;
otherwise end the prompt with "Avoid: " and this list:

```
cartoon, clip art, vector icon, flat design, coloring book, thick outlines, bold uniform lines, isometric game asset, toy-like, cute, simplified, low detail, 3D render, CGI, color, gray shading, gradients, glass, transparency, glow, reflections, smoke, motion blur, vintage, antique, steampunk, Victorian, text, watermark, frame
```

## Style reference

Attach a render of the chip (hardware) or the neural network (diagrams) as a style reference (ChatGPT/Gemini: attach it and
say "in exactly the drawing style of the attached image"; Midjourney: `--sref <url>`). It
does more than any wording: without it, "line drawing" prompts drift to cartoon and clip art.

Why each clause is there:

- **Opaque, defined by edges.** These are pen sketches, traced to outlines. Glass,
  transparency, light, glow, smoke and reflections have no edges to trace: they
  vanish or come back as noise. Show insides with cutaways and section hatching.

- **No gray fills, no gradients.** The tracer outlines every tone boundary, so a
  gray area comes back as hundreds of contour lines. The truck (8k paths) is
  what that looks like.
- **Code as indented dashes.** Reads unmistakably as code, and can't come back
  as gibberish glyphs.
- **Fully in frame.** A cropped edge traces as long meaningless lines, and the
  trim keeps long lines first.
- **Exploded view, schematic lines as engraving.** What lets a machine (the bee)
  and a diagram (the network) sit in one family.
