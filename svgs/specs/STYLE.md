# Line drawing style block

Every image prompt starts with this block, verbatim, then the drawing's subject
block. Change it here only, and regenerate every drawing if you do: a drawing
made under an older style block will look like a different artist.

```
Highly detailed technical illustration in black ink line art on a pure white background, in the style of a vintage engineering patent drawing and a cutaway plate from a technical manual. Intricate: hundreds of small parts, screws, seams, cables and fine surface detail. Clean confident outlines with thinner interior lines; shading only with fine parallel hatching, cross-hatching and stippling that follows the form. No color, no gray fills, no gradients, no large solid black areas. Three-quarter isometric view from slightly above. Single object, centered, fully in frame with generous white margin. No text, no labels, no numbers, no letters, no background, no ground shadow, no border.
```

Then one orientation line, from the card's column:

- left column (art in the top-left corner): `Composition flows toward the lower right.`
- right column (art in the top-right corner): `Composition flows toward the lower left.`

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
