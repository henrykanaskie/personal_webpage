# AccliMate: Codebase Onboarding Assistant
Card: project, left column
Concept: plate: a source file taken apart along its syntax tree, each chunk traceable to its exact lines

## Claims → parts
| Claim (from the description) | Part |
|---|---|
| Paste a GitHub URL (a whole repository) | fanned stack of code sheets |
| Chunked by AST rather than line count | syntax tree rising from the lifted sheet, leaf chunks of different heights |
| Every claim cites the exact lines behind it | bracketed leader lines from chunks back to line ranges on the sheet |
| Reranked before an LLM answers | three chunks stacked in order beside the tree |
| Dependency tracing | faint web of arrows between sheets in the stack |

## Signature detail
The bracketed leader lines from leaf chunks back to exact line ranges: citation to the line is the project's claim to trust.

## Cut order
1. dependency web between sheets
2. ranked column of chunks
3. fan of the sheet stack (one sheet is enough)

## Prompt
```
Technical engraving-style line illustration, black ink on pure white background, no color, no gray fills, no gradients. Drawn like an engineering patent plate crossed with an exploded-view assembly diagram: precise uniform outlines, finer interior lines, shading only with parallel hatching, cross-hatching and stippling. Isometric three-quarter view from about 30 degrees above. Schematic elements (arrows, connector lines, brackets, dashed guide lines) are drawn as physical engraved lines within the scene. Any code or text is represented only as rows of short horizontal dashes with indentation, never readable characters. Single composition, centered, fully in frame with generous white margin. No labels, no numbers, no letters, no background scenery, no border.
Composition flows toward the lower right.
An exploded isometric assembly showing a source code file being parsed. At the lower left, a thick stack of thin rectangular sheets representing files in a repository, fanned slightly like a deck of cards, each sheet covered in rows of short dashes with nested indentation that clearly reads as code. The top sheet is lifted off the stack and floats above it at an angle. Rising out of that lifted sheet is an abstract syntax tree drawn as a real branching structure: a root node at the top, splitting into function nodes, then into block and statement nodes, each node a small beveled rectangular plate joined by thin rods, like a molecular model made of machined parts. The leaves of the tree are small rectangular chunks of dashed code lines, each chunk a different height because it follows the code's structure rather than a fixed line count. From three of the leaf chunks, thin precise leader lines with square bracket ends reach back down to the exact rows on the source sheet they came from, bracketing specific line ranges. To the right, those same three chunks stack up in order into a short column, as if ranked. Faintly in the background, a small web of nodes and arrows between other files in the stack suggests dependency tracing. Hatching on the plates, stippling on the sheet edges. Avoid: readable code, programming language logos, a robot, a chat bubble, a glowing brain, a magnifying glass.
```
