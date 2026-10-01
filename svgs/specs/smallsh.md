# smallsh: A Unix Shell in C
Card: project, right column
Subject: the shell's process tree: fork, pipe, background job and a signal, as a technical plate

## Claims → details
| Claim (from the description) | Detail in the drawing |
|---|---|
| A shell that runs commands | the shell process at the root, forking children |
| Foreground and background execution, job control | one child in front connected to the terminal, one set aside as a background job |
| I/O redirection and pipes | two children joined by a pipe, one's output running into a file |
| SIGINT and SIGTSTP handlers | a signal arriving and being routed to the foreground child only |

## Signature detail
The signal routed to the foreground child while the background job is untouched.

## Prompt
```
Hyper-detailed modern technical pen-and-ink drawing, like a contemporary engineering patent drawing or a cutaway in a current service manual. Drawn with a 0.1 mm technical pen in thin black lines of slightly varying weight; no thick outlines anywhere. The subject is accurate and current: real parts at true scale (screws, seams, connectors, components, cables), or for a diagram, every node and connection drawn precisely as solid geometry. Tone and form come only from dense, precise hatching, cross-hatching and stippling that follow each surface. Everything is opaque and defined by its edges: no glass, transparency, light, glow, reflections, smoke or motion effects; insides are shown by cutaways with hatched cut edges. Realistic three-quarter view from slightly above with gentle perspective. Black ink on pure white paper: no color, no gray wash, no gradients. One subject, centered, entirely in frame with a wide white margin. No readable text, letters or numbers; where text or code would appear, draw short dashes.
The subject faces toward the lower left.
A Unix shell's process tree drawn as a precise three-dimensional technical plate, in the manner of a network diagram: the shell process at the top as a small machined block with a terminal face showing rows of dashes and a prompt mark, forking downward along fine branching lines into child process blocks. Two children are joined side by side by a solid pipe; a third's output runs along a line into a document sheet; a fourth sits apart on a lower level, marked as a background job. A jagged signal line arrives from the side and is routed by the shell to the foreground child only. Avoid: cartoon, clip art, vector icon, flat design, coloring book, thick outlines, bold uniform lines, isometric game asset, toy-like, cute, simplified, low detail, 3D render, CGI, color, gray shading, gradients, glass, transparency, glow, reflections, smoke, motion blur, vintage, antique, steampunk, Victorian, text, watermark, frame.
```
