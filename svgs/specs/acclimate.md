# AccliMate: Codebase Onboarding Assistant
Card: project, left column
Subject: the repository's dependency graph, with one file opened to the lines an answer cites

## Claims → details
| Claim (from the description) | Detail in the drawing |
|---|---|
| Paste a GitHub URL, get an interactive guide to the repository | the repository itself: its files as nodes, clustered by folder |
| Dependency tracing | directed links between the files |
| Every claim cites the exact lines behind it | one file opened, three lines bracketed, a leader line to an answer card |

## Signature detail
The opened file with three bracketed lines: answers cited to the exact lines.

## Prompt
```
Hyper-detailed modern technical pen-and-ink drawing, like a contemporary engineering patent drawing or a cutaway in a current service manual. Drawn with a 0.1 mm technical pen in thin black lines of slightly varying weight; no thick outlines anywhere. The subject is accurate and current: real parts at true scale (screws, seams, connectors, components, cables), or for a diagram, every node and connection drawn precisely as solid geometry. Tone and form come only from dense, precise hatching, cross-hatching and stippling that follow each surface. Everything is opaque and defined by its edges: no glass, transparency, light, glow, reflections, smoke or motion effects; insides are shown by cutaways with hatched cut edges. Realistic three-quarter view from slightly above with gentle perspective. Black ink on pure white paper: no color, no gray wash, no gradients. One subject, centered, entirely in frame with a wide white margin. No readable text, letters or numbers; where text or code would appear, draw short dashes.
The subject faces toward the lower right.
A software repository drawn as a three-dimensional dependency graph: about thirty source files as small sheets of paper, each with a folded corner and rows of short indented dashes for code, grouped in clusters by folder, joined by fine directed lines with small arrowheads. At the center one file is drawn larger, opened toward the viewer; three of its rows are enclosed by a bracket, and a leader line runs from the bracket to a small card of dashed lines beside it, the answer that cites them. Avoid: cartoon, clip art, vector icon, flat design, coloring book, thick outlines, bold uniform lines, isometric game asset, toy-like, cute, simplified, low detail, 3D render, CGI, color, gray shading, gradients, glass, transparency, glow, reflections, smoke, motion blur, vintage, antique, steampunk, Victorian, text, watermark, frame.
```
