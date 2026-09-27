# Personal Website: Henry Kanaskie

## Design Context

### Users
A broad audience spanning recruiters and hiring managers evaluating engineering talent, fellow developers and collaborators exploring technical work, and photography clients or enthusiasts discovering visual portfolios. Visitors arrive with intent: they're assessing capability, seeking collaboration, or browsing creative work. The site must instantly communicate competence and taste to all three groups.

### Brand Personality
**Refined. Atmospheric. Crafted.**

The voice is confident but never loud: precision over promotion. Every interaction should feel intentional, like a well-engineered system that also happens to be beautiful. Technical depth is communicated through the quality of execution, not through explanation. The photography side carries warmth and immersion; the CS side carries clarity and sophistication. Both share an obsessive attention to detail.

### Aesthetic Direction
**Visual tone:** A fusion of technical minimalism and atmospheric elegance. Clean structure with rich, layered surfaces: glass morphism, iridescent gradients, film grain, and vapor effects create depth without clutter.

**Existing design language:**
- CS side is built from three materials on one sheet (tokens in `app/globals.css`, mirrored in `lib/tokens.ts`):
  - **Paper**: a dot grid. `components/DotField.tsx` (mounted once in the root layout, off on photography) redraws it as a fixed WebGL backdrop: dots part around the cursor, ripple on a click, and configure in a wave from the click on every navigation. The loop sleeps when nothing moves. It must paint dots at exactly the CSS positions (`paper` token), and a dot may never move more than half a grid cell, which is what lets the shader evaluate one cell per pixel.
  - **Metal**: one satin chrome material (the motion reel's pills, the same in both themes): a studio gradient with a dark horizon band, a soft upper-left highlight, a hairline rim and a soft shadow, with dark ink pressed into it. Every button and control is chrome (`.metal-surface`). Because everything is chrome, "you are here" is not the material: the current item is pressed into its socket (`.is-current`: light flips low, the shadow moves inside, an ink dot under the label), and the section index uses a chrome bead (`.metal-bead`). Titles and card headings are chrome lettering (`.metal-text`): the pill's gradient with a soft horizon, sized to one line of type (`1lh`) so every line gets the whole reflection, with no outline: the same bright chrome in both themes, carried on the light sheet by its dark horizon and a soft cast shadow sized in `em` (`--chrome-edge`). Line drawings are iridescent steel: strokes painted from a noise texture mapped through the glass edge's thin-film palette over steel (`AnimatedSvg`), so the colour drifts in soft patches with no direction; never a gradient sweep or a repeating one (that striped every line). No grain texture.
  - **Glass**: frosted panels (`.glass-panel` + `GlassLayers`). Cards and bubbles share one glass edge (`--edge-lip`, `--edge-film`): a white hairline, brighter on top and faint below, with a narrow thin film just inside it (pink left, cyan right, violet top, gold below). Cards wear it as `.edge-ring`, bubbles in `--bubble-edge` and `::after`, and the shaders (DotField's swell, LiquidBud's growth) draw the same values, so a card's edge and its bubble's edge are the same edge. Cards are the bubbles' glass: the same low fill (`--card-fill`, the bubbles' `--bubble-fill`), and under them DotField draws the dots as a bubble shows them (`GLASS_GLSL` in `lib/liquid.tsx`: blurred as by 1.6px, the lens's 22px circular bevel sampling inward with a slight colour split, the brightness lift and the rim's inner light). Cards marked `data-liquid` are liquid: as the cursor nears, a card's edge swells toward it on a critically damped spring, no wobble (a smooth union with a blob that never drips free). Every line on a card's edge (lip, film, specular line) lives in `.ring-mask`, and the panel itself carries only a broad drop shadow, so nothing crosses a swell. The card's rim sits in `.ring-mask`; `setRingHole` opens it around a swell and the shader draws the rim of the whole liquid outline there, so the border molds into the swell. The fill is mirrored in `paper.glass` so the swell matches the card.
    Panels use no `backdrop-filter`; it was the largest scroll cost. Only the small nav pills blur.
- Glass bubbles are the "More Info" panels, nothing decorative: `.glass-bubble` plus `lib/liquid.tsx`. Opening, the bubble is born out of the side of its card (`LiquidBud`, a WebGL signed distance field). The card keeps its whole edge while it grows: around the bud its own rim is opened (`setRingHole`, 40px falloff) and the canvas draws the rim of card and bulge as one outline there, so the card's edge runs unbroken out along the bulge. The surface starts as exactly the card's material (`GLASS_GLSL` under the card fill, lensed at the rim of the growing shape, plus a thin band inside the card's edge so the frost bends continuously) and, the further it's stretched out of the card, thins into the bubble's clear film, carrying the shared glass edge with it, so the bubble is visibly made of the card's edge: the card's own edge swells into a dome (the bud starts inside the card, under a wide smooth union), stretches out as the union narrows into a neck, pinches, and comes free while the card's side settles back. In flight a single spring carries it from where it broke off to its box, moving, growing and rounding its corners together (one critically damped motion with no bounce; separate move and grow springs made it arrive and then inflate, like filling a shape), and the card's side settles back flat without a wobble. After the break it's a plain union, never a smooth one, and it's pushed away as it grows to keep an 8px gap, so it can't touch and reconnect to the card. It flies carrying its film rim and a wide faint shadow (a tight one reads as an outline); as it settles, the real frosted bubble (a soft rectangle) fades in over it and the card's rim closes again. The canvas rim is drawn only near the bud, never over the whole card: the canvas sits above the fixed header, so a full-card rim would cross the header's buttons. Bubbles are frosted but see-through, the same material in both themes: a 1.6px blur (enough to soften the dots behind, never to hide them), a low white scatter fill (so on the dark sheet the glass reads slightly lighter than what's behind it, never a grey slab), no grain (the frost is the blur alone; a grain read as noise), and the light a curved edge catches (a bright top lip, a faint lower one, a slightly brighter rim). Their only colour is iridescence: a thin-film rim (narrow inset colour at each edge, slowly drifting in hue) and prismatic dispersion in the lens. No specular spot. Closing, it pops into vapor. In Chromium each bubble also refracts what's behind it (`useGlassLens`): a thick convex lens, flat in the middle and magnifying in a band at the rim with a circular profile, sampling inward only.
- Performance rules (each of these was a measured freeze while scrolling):
  - Never create a WebGL context when a bubble appears. `LiquidBud` draws on pooled canvases (`takeBudGL`/`returnBudGL` in `lib/liquid.tsx`) that keep their context and shader and move into the budding card; the first is made when the page is idle, and the shader compiles in the background (`KHR_parallel_shader_compile`), so the bud waits a frame at a time instead of blocking.
  - The lens map is built in closed form, cached per size, on a CPU-backed canvas, and only when the page is idle.
  - Endless decorative motion is CSS on transform or opacity (the compositor runs it), never a Framer Motion `repeat: Infinity` on `x`/`y`, which keeps the main thread rendering every frame.
  - DotField skips the cursor and ripple work deep inside cards (the frost covers it).
- Mobile and Safari (keep these when changing the effects above):
  - Touch has no hover, so in DotField a finger stands in for the cursor while it's down (dots part under it, a card's edge reaches toward it); the loop clears it on pointerup/pointercancel.
  - The dot field canvas is `.dot-field`, sized to `100lvh`, and only reallocates on a width change or when it grows, so iOS Safari's collapsing toolbar doesn't resize it mid-scroll. If iOS drops the WebGL context, the canvas hides and the CSS dot grid shows.
  - Nothing decorative may widen the page: `LiquidBud` clamps its canvas to the viewport, and `html, body` have `overflow-x: clip` as a safety net.
  - The SVG lens is Chromium only. Elsewhere `html:not(.lens)` gives bubbles a stand-in: a feathered rim band that frosts harder, as thick glass does at its edge.
  - Chrome lettering falls back to `1.2em` lines where `lh` isn't supported (Safari before 16.4). The chrome glint on controls runs only under `(hover: hover)`, so a tap doesn't leave it stuck.
- Theme switching is the halftone curtain (`lib/themeTransition.ts`, from the toggle in `Header.tsx`): from the toggle, the page's own dots swell in a wave, in the colour of the sheet they're becoming, each with a hairline in the old ink as it grows, until the cells close up; the theme swaps under the cover; then the same wave shrinks them back down to ordinary dots in the new ink, uncovering the page. It runs about 2.5s, slow enough to watch the sheet morph. It's a 2D canvas over everything on the page's grid, so it works in every browser; reduced motion swaps instantly, and timers make sure the page is never left covered.
- Motion: cards rise into place on the shared critically damped spring in `lib/motion.ts`; nothing slides in from off screen. Line drawings are CSS transitions (`.line-draw`), drawn once and left drawn.
- Projects also appear as a parts list titled "Everything I've built" (no sheet numbers) (`components/PartsList.tsx`, data in `lib/parts.ts`), mirroring the GitHub profile's `data/profile.toml`
- Glass morphism with subtle blur, saturation, and specular highlights
- Iridescent color shifts: Photography's palette; on the CS side only as the glass edge's thin film (cards and bubbles) and dispersion in the bubbles' lens (everything else is graphite ink and chrome; the `cs.iridescent*` token names remain but hold neutral values)
- Film grain overlay for photographic texture
- Vapor particle effects for interactive delight
- Animated SVG line drawings for technical illustration
- Dual-font system: Inter (body precision) + Space Grotesk (display character)
- Responsive clamp-based typography scaling
- Dark/light modes with carefully tuned palettes for each

**Anti-references:** Generic portfolio templates, overly playful/cartoon aesthetics, heavy drop shadows, stock photography, anything that looks like a Bootstrap theme or default Material Design.

### Design Principles

1. **Precision is personality**: Every pixel, transition, and gradient should feel deliberate. The craftsmanship *is* the brand statement.
2. **Atmosphere over decoration**: Effects (glass, grain, bokeh, iridescence) serve mood and immersion, not novelty. If it doesn't deepen the experience, remove it.
3. **Reward exploration**: Subtle interactions, hover states, and motion should surprise without demanding attention. The site should feel richer the longer you spend with it.
4. **Two moods, one voice**: The CS and Photography sections have distinct palettes and textures but share the same level of refinement and the same underlying design system.
5. **Aesthetics first**: When visual impact and strict accessibility conflict, lean toward the visual experience. Maintain basic usability but don't compromise the atmosphere for edge-case compliance.

### Technical Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 with class-based dark mode
- Framer Motion for all animation
- Mobile-first responsive with clamp() typography
- Image optimization via Sharp (2400px max, JPEG quality 85)

## Writing style

Do not use em dashes (U+2014) anywhere: prose, documentation, code comments, commit
messages, string literals, and UI copy all included. Use a comma, colon, semicolon,
or parentheses instead, or split the sentence in two. Hyphens and en dashes (U+2013)
in ranges and compounds are fine.
