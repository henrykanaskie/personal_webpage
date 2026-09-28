/**
 * Diving into a chapter as one continuous motion.
 *
 * Clicking a chapter title (or a print) in the depth flight lifts that element
 * out of the 3D scene into a fixed overlay that outlives the flight page. While
 * the flight dives on and dissolves around it and the chapter page mounts
 * underneath, the overlay glides on a critically damped spring into the place
 * the element has on the chapter page: the title into the page's photo-filled
 * heading (restyling into it on the way), a print into its tile in the grid.
 * When it lands exactly on top, the real element is revealed under it and the
 * overlay fades, so the page simply opens up around what you clicked: no cut,
 * no second entrance.
 *
 * The overlay is plain DOM driven by its own animation frame loop, so it keeps
 * running across the route change. It finds its landing spot by watching the
 * DOM for the new page's element; if none appears (a page without a matching
 * heading), it swells and fades where it is.
 */

type Box = { cx: number; cy: number; w: number };
interface Layer {
  el: HTMLElement;
  // the glyph (or image) box at scale 1, relative to the overlay's origin
  ox: number;
  oy: number;
  w: number;
  h: number;
}

interface Flight {
  href: string;
  mode: "title" | "print";
  root: HTMLDivElement;
  a: Layer; // as it looked in the flight
  b: Layer | null; // title mode: as it looks on the chapter page
  start: number;
  pos: Box;
  vel: Box;
  rot: number;
  vrot: number;
  target: Box | null;
  guess: Box;
  found: HTMLElement | null; // the real element on the new page, hidden until we land on it
  findTarget: () => HTMLElement | null;
  measure: (el: HTMLElement) => Box | null;
  // print mode: the chapter opened without its tile on screen, so the photo swells past the edges and dissolves
  dissolving: boolean;
  landedAt: number | null;
  targetAt: number;
  raf: number;
}

let flight: Flight | null = null;
// Where each chapter's heading landed last time, per viewport size: a perfect first guess on repeat visits
const seen = new Map<string, Box>();
const key = (href: string) => `${href}|${window.innerWidth}x${window.innerHeight}`;

/** True while a dive into `href` is on its way in; the chapter page uses it to skip its own entrance. */
export function diveArriving(href: string): boolean {
  return typeof window !== "undefined" && !!flight && flight.href === href && flight.landedAt === null;
}

// Exact critically damped spring step (no overshoot at any frame rate)
function spring(x: number, v: number, target: number, omega: number, dt: number): [number, number] {
  const d = x - target;
  const e = Math.exp(-omega * dt);
  return [target + (d + (v + omega * d) * dt) * e, (v - omega * (v + omega * d) * dt) * e];
}

function textBox(el: HTMLElement): DOMRect | null {
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  return r.width > 0 ? r : null;
}

function layer(el: HTMLElement, root: HTMLElement, box: (el: HTMLElement) => DOMRect | null): Layer {
  root.appendChild(el);
  const r = box(el) ?? el.getBoundingClientRect();
  return { el, ox: r.left, oy: r.top, w: Math.max(1, r.width), h: Math.max(1, r.height) };
}

function place(l: Layer, pos: Box, rot: number) {
  const k = pos.w / l.w;
  const ox = l.ox + l.w / 2;
  const oy = l.oy + l.h / 2;
  l.el.style.transformOrigin = `${ox}px ${oy}px`;
  l.el.style.transform = `translate(${(pos.cx - ox).toFixed(2)}px, ${(pos.cy - oy).toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${k.toFixed(5)})`;
}

function cleanup(f: Flight) {
  cancelAnimationFrame(f.raf);
  f.root.remove();
  if (f.found) f.found.style.visibility = "";
  if (flight === f) flight = null;
}

function run(f: Flight) {
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now - f.start;

    // Keep measuring the landing spot while flying: the page may still be settling under us
    if (f.found && f.landedAt === null) {
      const box = f.found.isConnected ? f.measure(f.found) : null;
      if (box) f.target = box;
      else if (!f.found.isConnected) f.found = null;
    }
    // Look for the landing spot on the new page as soon as it's in the DOM. Only once the route has
    // changed: until then the old page is still mounted, and the flight holds a copy of the same
    // photo, which the overlay would otherwise chase back into the dissolving scene.
    if (!f.found && location.pathname === f.href) {
      const el = f.findTarget();
      const box = el && f.measure(el);
      if (el && box) {
        f.found = el;
        el.style.visibility = "hidden";
        f.target = box;
        f.targetAt = now;
        seen.set(key(f.href), box);
      }
    }

    // A print whose tile isn't on screen once the chapter has opened: keep coming toward the viewer
    // and dissolve into the page instead of dropping to a spot at the bottom edge
    if (f.mode === "print" && !f.found && !f.dissolving && location.pathname === f.href) {
      // the chapter has mounted once its heading is in the DOM (outside the fading flight)
      if ([...document.querySelectorAll("main h1")].some((h) => !h.closest("[data-depth-world]"))) {
        f.dissolving = true;
        const cover = Math.max(window.innerWidth, window.innerHeight * (f.a.w / f.a.h)) * 1.15;
        f.guess = { cx: window.innerWidth / 2, cy: window.innerHeight / 2, w: cover };
        f.landedAt = now;
        f.root.style.transition = "opacity 0.6s ease-in";
        f.root.style.opacity = "0";
      }
    }

    const goal = f.target ?? f.guess;
    // Gentle while it only has a guess, firmer once it knows where it's going
    const omega = f.target ? 10 : f.dissolving ? 4 : 5.5;
    [f.pos.cx, f.vel.cx] = spring(f.pos.cx, f.vel.cx, goal.cx, omega, dt);
    [f.pos.cy, f.vel.cy] = spring(f.pos.cy, f.vel.cy, goal.cy, omega, dt);
    [f.pos.w, f.vel.w] = spring(f.pos.w, f.vel.w, goal.w, omega, dt);
    [f.rot, f.vrot] = spring(f.rot, f.vrot, 0, 7, dt);

    place(f.a, f.pos, f.rot);
    if (f.b) {
      // restyle from the flight's title into the chapter's photo-filled heading on the way
      const m = Math.min(1, Math.max(0, (t - 120) / 420));
      const s = m * m * (3 - 2 * m);
      f.a.el.style.opacity = String(1 - s);
      f.b.el.style.opacity = String(s);
      place(f.b, f.pos, f.rot);
    }

    if (f.landedAt === null) {
      const settled =
        f.target &&
        now - f.targetAt > 120 &&
        // within a pixel or two: the hand-over crossfade hides the rest, and the spring's tail is slow
        Math.abs(f.pos.cx - f.target.cx) < 1.5 &&
        Math.abs(f.pos.cy - f.target.cy) < 1.5 &&
        Math.abs(f.pos.w - f.target.w) < 2;
      const image = f.found instanceof HTMLImageElement ? f.found : f.found?.querySelector("img");
      const ready = f.mode === "title" || !image || (image.complete && image.naturalWidth > 0) || now - f.targetAt > 900;
      if ((settled && ready) || (f.target && now - f.targetAt > 1400)) {
        // Land: the real element takes over underneath, the overlay fades off it
        f.landedAt = now;
        if (f.found) {
          f.found.style.visibility = "";
          // show the tile's photo at once if it's loaded (it would otherwise fade in from its colour)
          if (image && image.complete && image.naturalWidth > 0) image.style.opacity = "1";
        }
        f.root.style.transition = "opacity 0.22s ease";
        f.root.style.opacity = "0";
      } else if (!f.target && t > 1500) {
        // Nowhere to land: open up and dissolve where it is
        f.landedAt = now;
        f.guess = { cx: f.pos.cx, cy: f.pos.cy, w: f.pos.w * 1.35 };
        f.root.style.transition = "opacity 0.35s ease";
        f.root.style.opacity = "0";
      }
    } else if (now - f.landedAt > (f.dissolving ? 700 : 400)) {
      cleanup(f);
      return;
    }
    if (t > 4000) {
      cleanup(f);
      return;
    }
    f.raf = requestAnimationFrame(tick);
  };
  f.raf = requestAnimationFrame(tick);
}

function begin(f: Omit<Flight, "start" | "vel" | "vrot" | "target" | "found" | "landedAt" | "targetAt" | "raf" | "dissolving">) {
  if (flight) cleanup(flight);
  const full: Flight = { ...f, start: performance.now(), vel: { cx: 0, cy: 0, w: 0 }, vrot: 0, target: null, found: null, landedAt: null, targetAt: 0, raf: 0, dissolving: false };
  flight = full;
  place(full.a, full.pos, full.rot);
  if (full.b) place(full.b, full.pos, full.rot);
  full.root.style.visibility = "visible";
  run(full);
}

function overlayRoot(): HTMLDivElement {
  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  // Under the fixed photography nav (z 9999), over everything on the page
  root.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:0;overflow:visible;z-index:9000;pointer-events:none;visibility:hidden";
  document.body.appendChild(root);
  return root;
}

const abs = "position:absolute;left:0;top:0;white-space:nowrap;margin:0;will-change:transform,opacity;";

/**
 * Lift a chapter title out of the flight and carry it into the chapter's heading.
 * `from` is the title's text element in the 3D scene; it's hidden, the overlay stands in for it.
 */
export function diveTitle(opts: {
  href: string;
  from: HTMLElement;
  rotation: number;
  title: string;
  titleSize: string; // the chapter page's heading size (same CSS clamp)
  cover: string | null;
  ink: string;
  halo: string;
  stroke: string;
}) {
  const start = textBox(opts.from);
  if (!start) return false;
  const root = overlayRoot();

  const a = document.createElement("span");
  const cs = getComputedStyle(opts.from);
  a.textContent = opts.title;
  a.style.cssText = `${abs}font-family:${cs.fontFamily};font-weight:${cs.fontWeight};font-size:${cs.fontSize};line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};color:${opts.ink};text-shadow:${opts.halo};`;

  // The chapter heading's own styles (CategoryPageClient), including its full-width block, so the
  // photo fill is sized as on the page and the hand-over is invisible
  const b = document.createElement("h1");
  const text = document.createElement("span");
  text.textContent = opts.title;
  b.appendChild(text);
  b.style.cssText =
    `${abs}display:block;width:calc(100vw - 2 * clamp(18px, 5vw, 72px));font-family:var(--font-elevated);font-weight:500;font-size:${opts.titleSize};` +
    `line-height:0.86;padding:0.14em 0.06em 0.18em 0;letter-spacing:-0.045em;color:transparent;` +
    (opts.cover ? `background-image:url("${opts.cover}");` : `background-color:${opts.ink};`) +
    `background-size:140% auto;-webkit-background-clip:text;background-clip:text;background-position:50% 45%;-webkit-text-stroke:1px ${opts.stroke};opacity:0;`;

  const la = layer(a, root, textBox);
  const lb = layer(b, root, () => textBox(text));

  const pos = { cx: start.left + start.width / 2, cy: start.top + start.height / 2, w: start.width };
  // First guess at the heading's place: where it landed last time, else near the top left
  const pad = Math.min(72, Math.max(18, window.innerWidth * 0.05));
  const guess = seen.get(key(opts.href)) ?? { cx: pad + lb.w / 2, cy: window.innerHeight * 0.36, w: lb.w };

  opts.from.style.opacity = "0";
  begin({
    href: opts.href,
    mode: "title",
    root,
    a: la,
    b: lb,
    pos,
    rot: opts.rotation,
    guess,
    findTarget: () => {
      const h = [...document.querySelectorAll<HTMLElement>("main h1")].find((x) => x.textContent?.trim() === opts.title && !x.closest("[data-depth-world]"));
      return h ?? null;
    },
    measure: (el) => {
      const r = textBox(el);
      return r ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width } : null;
    },
  });
  return true;
}

/** Lift a print out of the flight and carry it into its tile on the chapter page. */
export function divePrint(opts: { href: string; from: HTMLElement; img: HTMLImageElement | null; rotation: number; src: string; aspect: number }) {
  const r = opts.from.getBoundingClientRect();
  if (!r.width) return false;
  const root = overlayRoot();
  const img = document.createElement("img");
  img.src = opts.img?.currentSrc || opts.img?.src || "";
  img.alt = "";
  const w0 = 400;
  img.style.cssText = `${abs}display:block;width:${w0}px;height:${(w0 / opts.aspect).toFixed(1)}px;object-fit:cover;border-radius:2px;box-shadow:0 18px 40px -20px rgba(0,0,0,0.6);`;
  const la = layer(img, root, (el) => el.getBoundingClientRect());

  // The print shrinks from its white border to the photo, so start from the photo area
  const pos = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width };
  // While the chapter loads, the photo keeps coming toward you: toward the middle, growing
  const guess = { cx: window.innerWidth / 2, cy: window.innerHeight / 2, w: Math.min(window.innerWidth * 0.9, pos.w * 3.5) };
  const needle = encodeURIComponent(opts.src);

  // hide the whole print (frame too), not just the photo the overlay stands in for
  (opts.from.closest("button") ?? opts.from).style.opacity = "0";
  begin({
    href: opts.href,
    mode: "print",
    root,
    a: la,
    b: null,
    pos,
    rot: opts.rotation,
    guess,
    findTarget: () => {
      const im = [...document.querySelectorAll<HTMLImageElement>("main img")].find(
        // not the flight's own copy: the old page is still mounted while it fades out
        (x) => x.getAttribute("src")?.includes(needle) && !x.closest("[data-depth-world]") && x.getBoundingClientRect().width > 40,
      );
      if (!im) return null;
      const b = im.getBoundingClientRect();
      // only a tile that's on screen: flying off the bottom would read as falling away
      // the tile itself (image > zoom layer > tile), so its placeholder colour hides too. Only a tile
      // that's wholly on screen: landing half off the bottom edge read as the photo falling away.
      const tile = im.parentElement?.parentElement ?? im.parentElement;
      return b.top >= 0 && b.bottom <= window.innerHeight ? (tile as HTMLElement) : null;
    },
    measure: (el) => {
      const b = el.getBoundingClientRect();
      return b.width ? { cx: b.left + b.width / 2, cy: b.top + b.height / 2, w: b.width } : null;
    },
  });
  return true;
}
