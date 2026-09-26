// ─── Design Tokens ──────────────────────────────────────────────────────────
// Single source of truth for all design values.
// Consumed by inline styles, Framer Motion, and Tailwind class strings.

// ─── Helper ─────────────────────────────────────────────────────────────────

export const themed = <T>(isDark: boolean, dark: T, light: T): T =>
  isDark ? dark : light;

// ─── CS Palette ─────────────────────────────────────────────────────────────
// Graphite ink and satin chrome. The old "iridescent" names are kept so the
// call sites didn't all have to change; none of them is iridescent any more.

export const cs = {
  // 8-stop 135deg: primary titles (GlassTitle, InfoBox h2, ProjectCard h2, EducationCard h2)
  iridescent: {
    light: `linear-gradient(135deg, #2b2a27 0%, #4a4843 45%, #2b2a27 100%)`,
    dark: `linear-gradient(135deg, #e9e7e2 0%, #b9b6b0 45%, #e9e7e2 100%)`,
  },

  // 8-stop 135deg: active/hover state
  iridescentActive: {
    light: `linear-gradient(135deg, #121110, #121110)`,
    dark: `linear-gradient(135deg, #ffffff, #ffffff)`,
  },

  // 8-stop 90deg: SkillBar fill, progress bars
  iridescentHorizontal: {
    light: `linear-gradient(180deg, #ffffff 0%, #e6e4e0 20%, #cbc8c2 44%, #9a968f 58%, #75716b 62%, #a9a59f 75%, #dfdcd6 91%, #f8f6f2 100%)`,
    dark: `linear-gradient(180deg, #ffffff 0%, #e6e4e0 20%, #cbc8c2 44%, #9a968f 58%, #75716b 62%, #a9a59f 75%, #dfdcd6 91%, #f8f6f2 100%)`,
  },

  // 5-stop 90deg: ProjectCard deployment progress bar
  progressBar: {
    light: `linear-gradient(180deg, #ffffff 0%, #e6e4e0 20%, #cbc8c2 44%, #9a968f 58%, #75716b 62%, #a9a59f 75%, #dfdcd6 91%, #f8f6f2 100%)`,
    dark: `linear-gradient(180deg, #ffffff 0%, #e6e4e0 20%, #cbc8c2 44%, #9a968f 58%, #75716b 62%, #a9a59f 75%, #dfdcd6 91%, #f8f6f2 100%)`,
  },

  // 2-stop 135deg: GPA, nav dot gradient, short accent
  iridescentShort: {
    light: `linear-gradient(135deg, #2b2a27 0%, #4a4843 45%, #2b2a27 100%)`,
    dark: `linear-gradient(135deg, #e9e7e2 0%, #b9b6b0 45%, #e9e7e2 100%)`,
  },

  // 3-stop 180deg: section nav dot fill
  iridescentVertical: {
    light: `linear-gradient(180deg, #2b2a27 0%, #4a4843 45%, #2b2a27 100%)`,
    dark: `linear-gradient(180deg, #e9e7e2 0%, #b9b6b0 45%, #e9e7e2 100%)`,
  },

  // 3-stop 135deg: mid-weight accent (project section headings, etc.)
  iridescentMedium: {
    light: `linear-gradient(135deg, #2b2a27 0%, #4a4843 45%, #2b2a27 100%)`,
    dark: `linear-gradient(135deg, #e9e7e2 0%, #b9b6b0 45%, #e9e7e2 100%)`,
  },

  // Liquid glass / crystalline text gradient (matches GlassTitle crystalline variant)
  // Card headings: solid ink (a flat "gradient" so existing background-clip call sites keep working).
  liquidGlass: {
    light: `linear-gradient(#1b1a17, #1b1a17)`,
    dark: `linear-gradient(#efede9, #efede9)`,
  },

  // Standalone color (for stroke, color props, not gradients)
  color: {
    light: "#3a3834",
    dark: "#d6d4cf",
  },

  // 8-stop 135deg: company/role/description text (near-white dark, near-black light)
  body: {
    light: `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 15%, rgba(10,20,30,0.94) 30%, rgba(30,15,25,0.9) 45%, rgba(10,20,28,0.93) 60%, rgba(22,12,32,0.91) 75%, rgba(12,18,30,0.94) 90%, rgba(28,15,28,0.91) 100%)`,
    dark: `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 15%, rgba(248,252,255,0.95) 30%, rgba(255,250,255,0.92) 45%, rgba(245,250,255,0.94) 60%, rgba(255,248,255,0.93) 75%, rgba(248,250,255,0.95) 90%, rgba(255,248,255,0.93) 100%)`,
  },

  // 3-stop 135deg: SkillBar label, EducationCard extras
  bodyShort: {
    light: `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 50%, rgba(12,18,30,0.94) 100%)`,
    dark: `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 50%, rgba(248,250,255,0.95) 100%)`,
  },

  // Direct color for body/description text (no gradient needed at small sizes)
  bodyColor: {
    light: "rgba(10,10,20,0.92)",
    dark: "rgba(248,250,255,0.94)",
  },

  // Theme toggle icon colors
  toggle: {
    light: "#1b1a17",
    dark: "#1b1a17",
  },

  // Toggle hover background
  toggleHover: {
    light: "rgba(0,0,0,0)",
    dark: "rgba(0,0,0,0)",
  },

  // Nav active bubble border/shadow
  navActiveBorder: {
    light: "none",
    dark: "none",
  },
  navActiveShadow: {
    light: "var(--metal-rim)",
    dark: "var(--metal-rim)",
  },

  // SkillBar fill glow
  skillBarShadow: {
    light: "inset 0 0 0 0.5px rgba(46,38,28,0.35), inset 0 1px 0 #fff",
    dark: "inset 0 0 0 0.5px rgba(46,38,28,0.35), inset 0 1px 0 #fff",
  },

  // GlassTitle text shadow
  titleShadow: {
    light: `0 1px 0 rgba(255,255,255,0.75)`,
    dark: `0 -1px 0 rgba(0,0,0,0.7)`,
  },
} as const;

// ─── Paper ──────────────────────────────────────────────────────────────────
// Mirrors --paper, --dot and --dot-gap in app/globals.css. The WebGL dot field
// paints over the CSS dots, so these must match exactly or the seam shows.

export const paper = {
  gap: 24,
  dotRadius: 1.15,
  light: { bg: [0xf1, 0xf0, 0xed], dot: [52, 48, 42], dotAlpha: 0.27 },
  dark: { bg: [0x0c, 0x0d, 0x10], dot: [196, 204, 222], dotAlpha: 0.16 },
  // The frosted cards' fill (--glass-fill): the shaders paint the same fill
  // wherever a card's liquid edge reaches past its DOM box.
  glass: {
    light: { fill: [255, 255, 255], alpha: 0.58 },
    dark: { fill: [26, 28, 33], alpha: 0.7 },
  },
} as const;

// ─── Photography Palette (warm rose/periwinkle) ─────────────────────────────

export const photo = {
  toggle: {
    light: "rgb(100, 80, 115)",
    dark: "rgb(218, 198, 228)",
  },
  toggleHover: {
    light: "rgba(128,72,138,0.06)",
    dark: "rgba(195,175,225,0.06)",
  },
  background: {
    light: "#f8f5f0",
    dark: "#050507",
  },
} as const;

// ─── Glass Morphism ─────────────────────────────────────────────────────────

export const glass = {
  backdropFilter: "blur(1.3px) saturate(1.15)",
  edgeBlur: "blur(3px) saturate(1.1)",
  edgeMask: "radial-gradient(ellipse at center, transparent 55%, black 100%)",

  chromaticAberration:
    "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)",

  specular: {
    top: {
      light:
        "linear-gradient(90deg, transparent, rgba(16,112,196,0.30) 30%, rgba(16,112,196,0.40) 50%, rgba(16,112,196,0.30) 70%, transparent)",
      dark:
        "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
    },
    bottom: {
      light:
        "linear-gradient(90deg, transparent, rgba(16,112,196,0.14) 30%, rgba(16,112,196,0.18) 50%, rgba(16,112,196,0.14) 70%, transparent)",
      dark:
        "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)",
    },
  },

  refraction: {
    left:
      "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
    right:
      "radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.02) 30%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
  },
} as const;

// ─── Tailwind Class Strings ─────────────────────────────────────────────────

// The materials themselves live in app/globals.css (.glass-pill, .glass-panel,
// .metal-surface) so light and dark resolve through CSS variables, not React state.
export const glassBubbleClassNames = "metal-surface";
export const glassBoxClassNames = "glass-panel";
export const metalClassNames = "metal-surface";

// ─── Radii ──────────────────────────────────────────────────────────────────

export const radii = {
  card: 24,
  inner: 12,
  badge: 6,
  pill: 999,
} as const;

// ─── Animation ──────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    pageEnter: 0.3,
    pageExit: 0.6,
    boxEntrance: 1.2,
    boxVisibility: 1.8,
    bubble: 0.75,
    svgDraw: 3,
    svgUndraw: 1.8,
    svgFastUndraw: 0.35,
  },
  easing: {
    snappy: [0.22, 1, 0.36, 1] as const,
    bouncy: [0.34, 1.56, 0.64, 1] as const,
    exitAccel: [0.5, 0, 0.75, 0] as const,
    smooth: [0.25, 1, 0.5, 1] as const,
  },
} as const;
