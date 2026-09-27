// ─── Shared motion ──────────────────────────────────────────────────────────
// One entrance for every card on the CS side. Things rise into place on a
// critically damped spring (damping ratio ~1): they arrive and settle, they
// don't bounce, and nothing travels across the whole screen to get there.

export const settle = { type: "spring", stiffness: 140, damping: 24, mass: 1 } as const;

export const rise = {
  hidden: { opacity: 0, y: 40, scale: 0.985 },
  shown: { opacity: 1, y: 0, scale: 1 },
} as const;

// Leaving a page: a short lift and fade, quick enough that the next page
// isn't kept waiting behind it.
export const leave = { opacity: 0, y: -12, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } } as const;
