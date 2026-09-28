# Capacitor Matching Network Solver
Card: project, left column
Object: the RF board: four matched capacitors on a diamond bridge
Code-drawn version: `svgs/draw/scenes.py`, `capMatch()`

## Claims → details
| Claim (from the description) | Detail on the object |
|---|---|
| An RF layout problem | an RF board with SMA connectors at each end, a copper pour edge stitched with vias |
| Four capacitors | four radial disc capacitors on their leads |
| A bridge network | the traces form a diamond, a capacitor on each edge |
| Electrically symmetric rather than merely close | the four discs are identical and placed symmetrically |

## Signature detail
Four identical capacitors placed symmetrically on the diamond: symmetry over a closer number.

## Prompt
```
Technical engraving-style line illustration, black ink on pure white background, no color, no gray fills, no gradients. Drawn like an engineering patent plate crossed with an exploded-view assembly diagram: precise uniform outlines, finer interior lines, shading only with parallel hatching, cross-hatching and stippling. Isometric three-quarter view from about 30 degrees above. Schematic elements (arrows, connector lines, brackets, dashed guide lines) are drawn as physical engraved lines within the scene. Any code or text is represented only as rows of short horizontal dashes with indentation, never readable characters. Single composition, centered, fully in frame with generous white margin. No labels, no numbers, no letters, no background scenery, no border.
Composition flows toward the lower right.
A small RF circuit board in three-quarter view: rounded corners, four mounting holes, a copper pour border stitched with small vias, gold SMA connectors with threaded barrels and hex bodies at both ends. Microstrip traces run from each connector to a diamond-shaped bridge in the center; on each of the diamond's four edges stands a radial ceramic disc capacitor on two wire leads, all four identical and placed symmetrically. Avoid: component labels, color bands, schematic symbols, text.
```
