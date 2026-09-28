# smallsh: A Unix Shell in C
Card: project, right column
Concept: machine: the shell as a hydraulic manifold whose pipes are the process tree, with a signal routed only to the foreground job

## Claims → parts
| Claim (from the description) | Part |
|---|---|
| Job control (a process tree) | central vessel branching by pipes into child vessels |
| Foreground and background execution | one child in front with its valve open, two on a rear shelf |
| Pipes | a straight pipe from one child's outlet to the next's inlet |
| I/O redirection | three-way valve diverting a child's output into a storage drum |
| SIGINT and SIGTSTP handlers correct once a process is backgrounded | pulse deflected by the shell's catch to the foreground child only |

## Signature detail
The signal pulse routed to the foreground child while the background vessels stay untouched: the exact edge case the description claims.

## Cut order
1. storage drum and three-way valve
2. straight pipe between children
3. second background vessel

## Prompt
```
Technical engraving-style line illustration, black ink on pure white background, no color, no gray fills, no gradients. Drawn like an engineering patent plate crossed with an exploded-view assembly diagram: precise uniform outlines, finer interior lines, shading only with parallel hatching, cross-hatching and stippling. Isometric three-quarter view from about 30 degrees above. Schematic elements (arrows, connector lines, brackets, dashed guide lines) are drawn as physical engraved lines within the scene. Any code or text is represented only as rows of short horizontal dashes with indentation, never readable characters. Single composition, centered, fully in frame with generous white margin. No labels, no numbers, no letters, no background scenery, no border.
Composition flows toward the lower left.
An isometric cutaway of a mechanical manifold system, drawn like a hydraulic engineering plate. At the center, a squat cylindrical pressure vessel, its front quarter cut away to show an internal valve assembly and a small spring-loaded catch mechanism. Branching out from the vessel's side ports are pipes leading to smaller child vessels, which themselves branch further, forming a clear tree built from pipes and junctions. One child vessel sits in the foreground connected by a pipe with its valve open, while two other child vessels sit on a lower rear shelf, connected by pipes through a bypass loop. Between two child vessels, a straight pipe joins one's outlet to the next's inlet. Another child's outlet is diverted by a three-way valve with its handle turned into a small cylindrical storage drum off to the side. Arriving from the upper edge, two thin zigzag pulse lines, like mechanical telegraph signals, strike the central vessel; the internal catch in the cutaway is engaged, deflecting one pulse down the pipe to only the foreground child, while the rear vessels remain untouched, their valves closed. Engraved hatching on metal, fine lines on flanges and bolts. Avoid: a computer terminal, a monitor, readable text, a dollar-sign prompt, lightning bolts, a seashell.
```
