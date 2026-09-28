# GPT From Scratch
Card: project, right column
Concept: plate: an exploded transformer block stacked on the single neuron it was built up from

## Claims → parts
| Claim (from the description) | Part |
|---|---|
| BPE tokenizer | row of token tiles, some fused from two smaller tiles |
| Positional encoding | plate of overlaid sine waves sliding into the embedding plate |
| Self-attention, multi-head attention (GPT: causal) | parallel head plates, each a grid with the lower triangle hatched |
| Layer, batch and RMS normalization | thin stippled plate between layers |
| Built up from a single neuron and backprop | one neuron at the base with a dashed arrow looping back |

## Signature detail
The causal mask (lower triangle hatched) on the attention heads: it's what makes this GPT and not just any transformer.

## Cut order
1. norm plate
2. sine-wave plate
3. residual pipes
4. feed-forward layer

## Prompt
```
Technical engraving-style line illustration, black ink on pure white background, no color, no gray fills, no gradients. Drawn like an engineering patent plate crossed with an exploded-view assembly diagram: precise uniform outlines, finer interior lines, shading only with parallel hatching, cross-hatching and stippling. Isometric three-quarter view from about 30 degrees above. Schematic elements (arrows, connector lines, brackets, dashed guide lines) are drawn as physical engraved lines within the scene. Any code or text is represented only as rows of short horizontal dashes with indentation, never readable characters. Single composition, centered, fully in frame with generous white margin. No labels, no numbers, no letters, no background scenery, no border.
Composition flows toward the lower left.
An exploded-view isometric engineering diagram of a transformer block, drawn as a vertical stack of machined plates separated by gaps, with thin vertical guide rods running through all of them as in an assembly drawing. At the bottom, a row of small interlocking puzzle-like tiles of varying widths, some visibly made of two smaller tiles fused together. Above them, an embedding plate: a flat grid of vertical columns. Beside the embedding plate, a thin plate etched with several overlaid sine waves of different frequencies, sliding in from the side to merge with it. Above that, the attention layer: several parallel thin plates side by side, one per head, each etched with a square grid matrix whose lower-left triangle is shaded with cross-hatching and whose upper-right triangle is blank; fine lines connect a few cells to tiles below. Above, a thin plate with a subtle stippled texture, then a feed-forward layer drawn as two rows of small spheres fully connected by fine lines. On one side, residual connections run as curved pipes bypassing each layer and rejoining above it. At the very base of the stack, separated and small like a foundation stone, a single neuron: one stippled sphere with a few input arrows and one output arrow, with a thin dashed curved arrow looping backward from output to inputs. Engraved hatching on plate edges, stippled spheres in the style of a classic neural network diagram. Avoid: text labels, a robot, a chat interface, glow, a brain.
```
