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
  - **Metal**: one satin chrome material (the motion reel's pills, the same in both themes): a studio gradient with a dark horizon band, a soft upper-left highlight, a hairline rim and a soft shadow, with dark ink pressed into it. Every button and control is chrome (`.metal-surface`). Because everything is chrome, "you are here" is not the material: the current item is pressed into its socket (`.is-current`: light flips low, the shadow moves inside, an ink dot under the label), and the section index uses a chrome bead (`.metal-bead`). Titles and card headings are chrome lettering (`.metal-text`): the pill's gradient with a soft horizon, sized to one line of type (`1lh`) so every line gets the whole reflection, with no outline: the same bright chrome in both themes, carried on the light sheet by its dark horizon and a soft cast shadow sized in `em` (`--chrome-edge`). Line drawings are steel wire (a reflecting stroke gradient, `--wire-*`). No grain texture.
  - **Glass**: frosted panels with a hairline metal rim (`.glass-panel` + `GlassLayers`). Cards marked `data-liquid` are liquid: DotField draws the dots under them blurred and bent at the rim (the frost), and as the cursor nears, a card's edge swells toward it on an underdamped spring (a smooth union with a blob that never drips free). The card's rim sits in `.ring-mask`; `setRingHole` opens it around a swell and the shader draws the rim of the whole liquid outline there, so the border molds into the swell. The fill is mirrored in `paper.glass` so the swell matches the card.
    Panels use no `backdrop-filter`; it was the largest scroll cost. Only the small nav pills blur.
- Glass bubbles are the "More Info" panels, nothing decorative: `.glass-bubble` plus `lib/liquid.tsx`. Opening, the bubble is born out of the side of its card (`LiquidBud`, a WebGL signed distance field). While it grows the card has no border at all (`.is-budding` fades its rim, hairlines and edge light), and the growth is drawn in exactly the card's material (DotField's frost under the card fill, plus a thin band inside the card's edge so the frost bends continuously), so it reads as the card itself growing: the card's own edge swells into a dome (the bud starts inside the card, under a wide smooth union), stretches out as the union narrows into a neck, pinches, and bursts free with an overshoot while the card's side snaps back; after the break only the freed droplet turns into see-through bubble with a faint thin-film sheen, then the real frosted bubble (a soft rectangle) fades in over it. Bubbles stay see-through: a light fill and a 1.4px blur, so the dots and drawings behind still read. Their only colour is iridescence: a thin-film rim (soft inset colour at each edge, slowly drifting in hue) and prismatic dispersion in the lens. No specular spot. Closing, it pops into vapor. In Chromium each bubble also refracts what's behind it (`useGlassLens`): a thick convex lens, flat in the middle and magnifying in a band at the rim with a circular profile, sampling inward only.
- Motion: cards rise into place on the shared critically damped spring in `lib/motion.ts`; nothing slides in from off screen. Line drawings are CSS transitions (`.line-draw`), drawn once and left drawn.
- Projects also appear as a bill of materials (`components/PartsList.tsx`, data in `lib/parts.ts`), mirroring the GitHub profile's `data/profile.toml`
- Glass morphism with subtle blur, saturation, and specular highlights
- Iridescent color shifts: Photography's palette; on the CS side only as thin film and dispersion on the glass bubbles (everything else is graphite ink and chrome; the `cs.iridescent*` token names remain but hold neutral values)
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
