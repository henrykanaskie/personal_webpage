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
  - **Metal**: polished chrome, not brushed: a studio reflection with a crisp horizon, for titles (`.metal-text`, the `metal` GlassTitle variant) and primary controls (`.metal-surface`, including the active nav item). No grain texture.
  - **Glass**: frosted panels with a hairline metal rim (`.glass-panel` + `GlassLayers`), glass pills for secondary controls.
    Panels use no `backdrop-filter`; it was the largest scroll cost. Only the small nav pills blur.
- Glass bubbles are the "More Info" panels, nothing decorative: `.glass-bubble` plus `lib/liquid.tsx`. Opening, a bubble buds off its card with a liquid neck that stretches and snaps (`LiquidBud`); closing, it pops into vapor. In Chromium each bubble refracts what's behind it through an SVG displacement map on `backdrop-filter` (`useGlassLens`); other browsers get clear glass.
- Motion: cards rise into place on the shared critically damped spring in `lib/motion.ts`; nothing slides in from off screen. Line drawings are CSS transitions (`.line-draw`), drawn once and left drawn.
- Projects also appear as a bill of materials (`components/PartsList.tsx`, data in `lib/parts.ts`), mirroring the GitHub profile's `data/profile.toml`
- Glass morphism with subtle blur, saturation, and specular highlights
- Iridescent color shifts (warm rose/periwinkle for Photography; on the CS side only as a faint thin-film tint on glass)
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
