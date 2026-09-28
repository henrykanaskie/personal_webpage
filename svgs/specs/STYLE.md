# Line drawing style block

Every image prompt starts with this block, verbatim, then the drawing's subject
block. Change it here only, and regenerate every drawing if you do: a drawing
made under an older style block will look like a different artist.

```
Hyper-detailed technical pen-and-ink drawing of a real, accurately proportioned object, drawn by a master technical illustrator: like a steel engraving in a 19th-century engineering journal or the cutaway in a factory service manual. Drawn with a 0.1 mm technical pen in thin black lines of slightly varying weight; no thick outlines anywhere. Every part is physically correct and real: screws, fasteners, seams, machined edges, springs, cables and small components, hundreds of them, at true scale. Tone and form come only from dense, precise hatching, cross-hatching and stippling that follow each surface's curvature. Realistic three-quarter view from slightly above with gentle perspective, as if photographed with a 50mm lens and then drawn. Black ink on pure white paper: no color, no gray wash, no gradients. One object, centered, entirely in frame with a wide white margin. No text, labels or numbers.
```

Then one orientation line, from the card's column:

- left column (art in the top-left corner): `The object faces toward the lower right.`
- right column (art in the top-right corner): `The object faces toward the lower left.`

## Session statement

For a chat-based generator (ChatGPT, Gemini), send this once at the start of the
conversation with a style reference attached, then send each drawing's object
paragraph on its own, one per message:

```
For every image in this conversation, follow these rules exactly. Match the drawing style of the attached reference image: its line weight, hatching and level of detail. Each image is a single real piece of engineering hardware, drawn as a hyper-detailed technical pen-and-ink illustration, like a steel engraving in a 19th-century engineering journal or the cutaway plate in a factory service manual. Draw with a 0.1 mm technical pen: thin black lines of slightly varying weight, never thick outlines. Every part must be physically real and correct at true scale: screws, fasteners, seams, machined edges, springs, cables and small components, hundreds of them. Build tone and form only with dense, precise hatching, cross-hatching and stippling that follows each surface. Use a realistic three-quarter view from slightly above with gentle perspective, as if photographed with a 50mm lens and then drawn. Black ink on pure white paper only: no color, no gray wash, no gradients, no background, no shadow on the ground, no border. One object, centered, entirely in frame with a wide white margin. No readable text, letters, numbers, labels or logos anywhere; where text or code would appear, draw rows of short dashes instead. Never cartoon, clip art, vector icon, flat design, coloring book, toy-like, cute, simplified or 3D render. Square image. When I send an object description, draw only that object under these rules.
```

## Negative prompt

Where the tool has a separate field (Midjourney `--no`, Stable Diffusion, Leonardo), put this there;
otherwise end the prompt with "Avoid: " and this list:

```
cartoon, clip art, vector icon, flat design, coloring book, thick outlines, bold uniform lines, isometric game asset, toy-like, cute, simplified, low detail, 3D render, CGI, color, gray shading, gradients, text, watermark, frame
```

## Style reference

Attach a render of the bee or the chip as a style reference (ChatGPT/Gemini: attach it and
say "in exactly the drawing style of the attached image"; Midjourney: `--sref <url>`). It
does more than any wording: without it, "line drawing" prompts drift to cartoon and clip art.

Why each clause is there:

- **No gray fills, no gradients.** The tracer outlines every tone boundary, so a
  gray area comes back as hundreds of contour lines. The truck (8k paths) is
  what that looks like.
- **Code as indented dashes.** Reads unmistakably as code, and can't come back
  as gibberish glyphs.
- **Fully in frame.** A cropped edge traces as long meaningless lines, and the
  trim keeps long lines first.
- **Exploded view, schematic lines as engraving.** What lets a machine (the bee)
  and a diagram (the network) sit in one family.
