# Capacitor Matching Network Solver
Card: project, left column
Concept: plate: a constraint solver's pruned search tree picking four matched parts from a real parts cabinet into a bridge

## Claims → parts
| Claim (from the description) | Part |
|---|---|
| A real, discrete inventory | parts cabinet with open drawers of loose disc capacitors |
| CP-SAT constraint programming | search tree with snipped branches and one surviving path |
| Pick four capacitors | four leader lines from the path's end |
| A bridge network | diamond-shaped board with a footprint on each edge |
| Electrically symmetric rather than merely close on paper | four near-identical capacitors placed symmetrically |

## Signature detail
Four nearly identical capacitors seated symmetrically in the diamond: symmetry over a closer number is the project's insight.

## Cut order
1. measurement probe
2. number of open drawers
3. depth of the search tree

## Prompt
```
Technical engraving-style line illustration, black ink on pure white background, no color, no gray fills, no gradients. Drawn like an engineering patent plate crossed with an exploded-view assembly diagram: precise uniform outlines, finer interior lines, shading only with parallel hatching, cross-hatching and stippling. Isometric three-quarter view from about 30 degrees above. Schematic elements (arrows, connector lines, brackets, dashed guide lines) are drawn as physical engraved lines within the scene. Any code or text is represented only as rows of short horizontal dashes with indentation, never readable characters. Single composition, centered, fully in frame with generous white margin. No labels, no numbers, no letters, no background scenery, no border.
Composition flows toward the lower right.
An isometric technical composition in three connected parts. At the back, a parts cabinet of small drawers in a grid, several pulled open to show loose disc capacitors of slightly different sizes inside, clearly a finite physical inventory. In the middle, rising above the cabinet, a search tree drawn as thin branching lines from a single root node downward, many branches ending abruptly in small clean cut marks as if snipped, and one single branch path drawn in heavier line weight that reaches all the way down. That surviving path ends in four thin leader lines that drop into the foreground. In the foreground, a small circuit board with a diamond-shaped bridge network: four capacitor footprints at the four edges of the diamond, connected by traces, with two solder pads on opposite corners. The four chosen capacitors descend from the leader lines into their four footprints; they are nearly identical in size, placed symmetrically. A small precision measurement probe touches the two output pads. Crosshatching on the cabinet, fine engraved lines on traces. Avoid: schematic symbols with letters, value labels, color bands, a Smith chart, a meter display with numbers.
```
