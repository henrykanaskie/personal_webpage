// ─── Scroll velocity emitter ─────────────────────────────────────────────────
// One window scroll listener shared across all subscribers.

type ScrollListener = (dy: number, velocity: number) => void;

const subscribers = new Set<ScrollListener>();
let lastY = 0;
let lastT = 0;
let listenerAttached = false;

function onScroll() {
  const y = window.scrollY;
  const now = performance.now();
  const dy = y - lastY;
  const dt = Math.max(16, now - lastT);
  lastY = y;
  lastT = now;
  const velocity = Math.abs(dy) / dt;
  subscribers.forEach((fn) => fn(dy, velocity));
}

export function subscribeScrollVelocity(fn: ScrollListener): () => void {
  if (typeof window === "undefined") return () => {};
  if (!listenerAttached) {
    lastY = window.scrollY;
    lastT = performance.now();
    window.addEventListener("scroll", onScroll, { passive: true });
    listenerAttached = true;
  }
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) {
      window.removeEventListener("scroll", onScroll);
      listenerAttached = false;
    }
  };
}

// ─── Shared shine RAF ─────────────────────────────────────────────────────────
// All GlassTitle instances register here. One RAF loop lerps every effect and
// calls setProperty in a single pass → one style-recalc batch per frame instead
// of N separate recalcs from N independent RAF loops.

interface ShineEffect {
  currentX: number;
  targetX: number;
  currentShineO: number;
  targetShineO: number;
  currentCausticO: number;
  targetCausticO: number;
  shineEl: HTMLElement | null;
  causticEl: HTMLElement | null;
}

const shineEffects = new Set<ShineEffect>();
let shineRafId = 0;
let shineIdleTimer: ReturnType<typeof setTimeout> | null = null;
let unsubShine: (() => void) | null = null;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function applyShines() {
  shineRafId = 0;
  let stillMoving = false;

  for (const e of shineEffects) {
    e.currentX = lerp(e.currentX, e.targetX, 0.14);
    e.currentShineO = lerp(e.currentShineO, e.targetShineO, 0.12);
    e.currentCausticO = lerp(e.currentCausticO, e.targetCausticO, 0.12);

    const xCss = `${e.currentX.toFixed(2)}%`;
    if (e.shineEl) {
      e.shineEl.style.setProperty("--glass-shine-x", xCss);
      e.shineEl.style.setProperty("--glass-shine-o", e.currentShineO.toFixed(3));
    }
    if (e.causticEl) {
      e.causticEl.style.setProperty("--glass-shine-x", xCss);
      e.causticEl.style.setProperty("--glass-caustic-o", e.currentCausticO.toFixed(3));
    }

    if (
      Math.abs(e.targetX - e.currentX) > 0.06 ||
      Math.abs(e.targetShineO - e.currentShineO) > 0.004 ||
      Math.abs(e.targetCausticO - e.currentCausticO) > 0.004
    )
      stillMoving = true;
  }

  if (stillMoving) shineRafId = requestAnimationFrame(applyShines);
}

function kickShines() {
  if (!shineRafId) shineRafId = requestAnimationFrame(applyShines);
}

function onShineScroll(dy: number, velocity: number) {
  for (const e of shineEffects) {
    e.targetX = clamp(e.targetX - dy * 0.35, -80, 220);
    e.targetShineO = clamp(velocity * 0.9, 0, 0.42);
    e.targetCausticO = clamp(velocity * 0.75, 0, 0.4);
  }
  if (shineIdleTimer) clearTimeout(shineIdleTimer);
  shineIdleTimer = setTimeout(() => {
    for (const e of shineEffects) {
      e.targetShineO = 0;
      e.targetCausticO = 0;
    }
    kickShines();
    shineIdleTimer = null;
  }, 120);
  kickShines();
}

export function registerShineEffect(
  shineEl: HTMLElement | null,
  causticEl: HTMLElement | null
): () => void {
  if (typeof window === "undefined") return () => {};

  const effect: ShineEffect = {
    currentX: 200,
    targetX: 200,
    currentShineO: 0,
    targetShineO: 0,
    currentCausticO: 0,
    targetCausticO: 0,
    shineEl,
    causticEl,
  };

  // Avoid first-paint flash.
  if (shineEl) {
    shineEl.style.setProperty("--glass-shine-x", "200%");
    shineEl.style.setProperty("--glass-shine-o", "0");
  }
  if (causticEl) {
    causticEl.style.setProperty("--glass-shine-x", "200%");
    causticEl.style.setProperty("--glass-caustic-o", "0");
  }

  if (shineEffects.size === 0) {
    unsubShine = subscribeScrollVelocity(onShineScroll);
  }
  shineEffects.add(effect);

  return () => {
    shineEffects.delete(effect);
    if (shineEffects.size === 0) {
      if (shineRafId) {
        cancelAnimationFrame(shineRafId);
        shineRafId = 0;
      }
      if (shineIdleTimer) {
        clearTimeout(shineIdleTimer);
        shineIdleTimer = null;
      }
      unsubShine?.();
      unsubShine = null;
    }
  };
}
