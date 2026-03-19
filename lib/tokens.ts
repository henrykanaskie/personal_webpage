// ─── Design Tokens ──────────────────────────────────────────────────────────
// Single source of truth for all design values.
// Consumed by inline styles, Framer Motion, and Tailwind class strings.

// ─── Helper ─────────────────────────────────────────────────────────────────

export const themed = <T>(isDark: boolean, dark: T, light: T): T =>
  isDark ? dark : light;

// ─── CS Palette (cool iridescent blue/purple) ───────────────────────────────

export const cs = {
  // 8-stop 135deg — primary titles (GlassTitle, InfoBox h2, ProjectCard h2, EducationCard h2)
  iridescent: {
    light: `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`,
    dark: `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`,
  },

  // 8-stop 135deg — active/hover state
  iridescentActive: {
    light: `linear-gradient(135deg, rgb(70,85,115) 0%, rgb(95,80,105) 15%, rgb(75,100,120) 30%, rgb(100,85,100) 45%, rgb(70,95,115) 60%, rgb(90,80,110) 75%, rgb(75,90,118) 90%, rgb(98,85,105) 100%)`,
    dark: `linear-gradient(135deg, rgb(220,235,255) 0%, rgb(245,230,250) 15%, rgb(220,245,255) 30%, rgb(250,235,245) 45%, rgb(215,240,255) 60%, rgb(240,230,250) 75%, rgb(220,238,255) 90%, rgb(245,230,248) 100%)`,
  },

  // 8-stop 90deg — SkillBar fill, progress bars
  iridescentHorizontal: {
    light: `linear-gradient(90deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`,
    dark: `linear-gradient(90deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`,
  },

  // 5-stop 90deg — ProjectCard deployment progress bar
  progressBar: {
    light: `linear-gradient(90deg, rgb(100,115,145), rgb(125,110,135), rgb(105,130,150), rgb(130,115,130), rgb(100,125,145))`,
    dark: `linear-gradient(90deg, rgb(180,200,255), rgb(210,185,230), rgb(180,210,235), rgb(215,190,215), rgb(180,200,255))`,
  },

  // 2-stop 135deg — GPA, nav dot gradient, short accent
  iridescentShort: {
    light: `linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))`,
    dark: `linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))`,
  },

  // 3-stop 180deg — section nav dot fill
  iridescentVertical: {
    light: `linear-gradient(180deg, rgb(100,115,145), rgb(125,110,135), rgb(105,130,150))`,
    dark: `linear-gradient(180deg, rgb(180,200,255), rgb(210,185,230), rgb(180,210,235))`,
  },

  // 3-stop 135deg — mid-weight accent (project section headings, etc.)
  iridescentMedium: {
    light: `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 50%, rgb(105,130,150) 100%)`,
    dark: `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 50%, rgb(180,210,235) 100%)`,
  },

  // Standalone color (for stroke, color props — not gradients)
  color: {
    light: "rgb(100,115,145)",
    dark: "rgb(180,200,255)",
  },

  // 8-stop 135deg — company/role/description text (near-white dark, near-black light)
  body: {
    light: `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 15%, rgba(10,20,30,0.94) 30%, rgba(30,15,25,0.9) 45%, rgba(10,20,28,0.93) 60%, rgba(22,12,32,0.91) 75%, rgba(12,18,30,0.94) 90%, rgba(28,15,28,0.91) 100%)`,
    dark: `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 15%, rgba(248,252,255,0.95) 30%, rgba(255,250,255,0.92) 45%, rgba(245,250,255,0.94) 60%, rgba(255,248,255,0.93) 75%, rgba(248,250,255,0.95) 90%, rgba(255,248,255,0.93) 100%)`,
  },

  // 3-stop 135deg — SkillBar label, EducationCard extras
  bodyShort: {
    light: `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 50%, rgba(12,18,30,0.94) 100%)`,
    dark: `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 50%, rgba(248,250,255,0.95) 100%)`,
  },

  // Theme toggle icon colors
  toggle: {
    light: "rgb(100, 115, 145)",
    dark: "rgb(195, 210, 240)",
  },

  // Toggle hover background
  toggleHover: {
    light: "rgba(100,115,145,0.08)",
    dark: "rgba(180,200,255,0.08)",
  },

  // Nav active bubble border/shadow
  navActiveBorder: {
    light: "1px solid rgba(100,115,145,0.25)",
    dark: "1px solid rgba(180,200,255,0.3)",
  },
  navActiveShadow: {
    light: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(100,115,145,0.1)",
    dark: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(180,200,255,0.1)",
  },

  // SkillBar fill glow
  skillBarShadow: {
    light: "0 0 8px rgba(100,115,145,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
    dark: "0 0 10px rgba(180,200,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
  },

  // GlassTitle text shadow
  titleShadow: {
    light: `0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.15), 2px 0 8px rgba(255,0,80,0.04), -2px 0 8px rgba(0,100,255,0.04), 0 2px 8px rgba(255,200,0,0.03), 0 -2px 8px rgba(0,200,255,0.03)`,
    dark: `0 1px 2px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.05)`,
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
        "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)",
      dark:
        "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
    },
    bottom: {
      light:
        "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)",
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

export const glassBubbleClassNames = `
  bg-white/[0.35]
  border border-[rgba(80,150,255,0.18)]
  shadow-[inset_0_1px_0_rgba(80,150,255,0.12)]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]

  dark:bg-white/[0.02]
  dark:border-[rgba(255,255,255,0.06)]
  dark:border-t-[rgba(255,255,255,0.1)]
  dark:border-r-[rgba(255,255,255,0.04)]
  dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
`;

export const glassBoxClassNames = `
  bg-transparent
  border border-[rgba(255,255,255,0.03)]
  border-t-[rgba(255,255,255,0.001)]
  border-r-[rgba(255,255,255,0.004)]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]

  dark:border-[rgba(255,255,255,0.06)]
  dark:border-t-[rgba(255,255,255,0.1)]
  dark:border-r-[rgba(255,255,255,0.04)]
  dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
`;

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
