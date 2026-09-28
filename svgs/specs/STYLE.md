# Line drawing style block

Every image prompt starts with this block, verbatim, then the drawing's subject
block. Change it here only, and regenerate every drawing if you do: a drawing
made under an older style block will look like a different artist.

```
Technical engraving-style line illustration, black ink on pure white background, no color, no gray fills, no gradients. Drawn like an engineering patent plate crossed with an exploded-view assembly diagram: precise uniform outlines, finer interior lines, shading only with parallel hatching, cross-hatching and stippling. Isometric three-quarter view from about 30 degrees above. Schematic elements (arrows, connector lines, brackets, dashed guide lines) are drawn as physical engraved lines within the scene. Any code or text is represented only as rows of short horizontal dashes with indentation, never readable characters. Single composition, centered, fully in frame with generous white margin. No labels, no numbers, no letters, no background scenery, no border.
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
