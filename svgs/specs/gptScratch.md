# GPT From Scratch
Card: project, right column
Object: a manual typewriter with its casing off
Code-drawn version: `svgs/draw/scenes.py`, `gptScratch()`

## Claims → details
| Claim (from the description) | Detail on the object |
|---|---|
| Generates text one token at a time | one typebar raised mid-strike at the platen |
| Built by hand, no layer a black box | the casing is off: the basket of typebars and linkages show |
| In progress toward a full GPT | the sheet's last line is only half written |

## Signature detail
The single typebar mid-strike and the half-written last line: autoregressive generation, one character at a time.

## Prompt
```
Technical engraving-style line illustration, black ink on pure white background, no color, no gray fills, no gradients. Drawn like an engineering patent plate crossed with an exploded-view assembly diagram: precise uniform outlines, finer interior lines, shading only with parallel hatching, cross-hatching and stippling. Isometric three-quarter view from about 30 degrees above. Schematic elements (arrows, connector lines, brackets, dashed guide lines) are drawn as physical engraved lines within the scene. Any code or text is represented only as rows of short horizontal dashes with indentation, never readable characters. Single composition, centered, fully in frame with generous white margin. No labels, no numbers, no letters, no background scenery, no border.
Composition flows toward the lower left.
A 1920s manual typewriter in three-quarter view with its outer casing removed: four stepped rows of round glass-topped keys on thin stems, a semicircular basket of thin typebars fanning toward the printing point with one typebar raised mid-strike, two ribbon spools, a long cylindrical platen with knurled knobs at each end, a carriage return lever, side frames and base. A sheet of paper rises from the platen with rows of short dashes for text; the last row is only half written. Avoid: readable letters, a person, a modern keyboard, robots.
```
