# orchestrate
Card: parts list (TUL-04), private
Subject: the project's task dependency graph, with agents working its nodes in parallel

## Claims → details
| Claim (from the parts list) | Detail in the drawing |
|---|---|
| Runs a team of Claude Code agents | several nodes being worked at once, each with an agent marker |
| At a project as a dependency graph | task nodes in layers joined by directed edges, converging to one finished node |
| Ordering by dependencies | finished nodes checked off upstream, blocked ones waiting downstream |

## Signature detail
Several tasks worked in parallel on one layer of the graph, the finished ones upstream checked off.

## Prompt
```
Hyper-detailed modern technical pen-and-ink drawing, like a contemporary engineering patent drawing or a cutaway in a current service manual. Drawn with a 0.1 mm technical pen in thin black lines of slightly varying weight; no thick outlines anywhere. The subject is accurate and current: real parts at true scale (screws, seams, connectors, components, cables), or for a diagram, every node and connection drawn precisely as solid geometry. Tone and form come only from dense, precise hatching, cross-hatching and stippling that follow each surface. Everything is opaque and defined by its edges: no glass, transparency, light, glow, reflections, smoke or motion effects; insides are shown by cutaways with hatched cut edges. Realistic three-quarter view from slightly above with gentle perspective. Black ink on pure white paper: no color, no gray wash, no gradients. One subject, centered, entirely in frame with a wide white margin. No readable text, letters or numbers; where text or code would appear, draw short dashes.
The subject faces toward the lower right.
A directed acyclic graph of tasks drawn as a precise three-dimensional technical plate, in the manner of a network diagram: about fifteen task nodes as small machined tiles, each with a few rows of dashes, arranged in layers from top to bottom and joined by fine arrows that branch and converge into a single final node at the bottom. The upper layer's tiles carry small check marks; on the middle layer, four tiles are being worked at once, each with a small agent unit docked against it; the lower tiles wait, plain. Avoid: cartoon, clip art, vector icon, flat design, coloring book, thick outlines, bold uniform lines, isometric game asset, toy-like, cute, simplified, low detail, 3D render, CGI, color, gray shading, gradients, glass, transparency, glow, reflections, smoke, motion blur, vintage, antique, steampunk, Victorian, text, watermark, frame.
```
