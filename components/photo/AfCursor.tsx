"use client";

import { useEffect, useRef, useState } from "react";
import { frameClock, smoothing } from "./utils";

const IDLE = 34;
const TARGETS = "[data-af], a, button";

/**
 * Autofocus-point cursor for the photography side (fine pointers only).
 * The brackets idle around the pointer, then snap and lock onto whatever they
 * hover, tracking its box every frame so moving and 3D-transformed photos stay
 * framed. A photo's data-af text appears under the brackets as a readout.
 */
export default function AfCursor() {
  const [enabled, setEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    html.classList.add("af-cursor");

    const pointer = { x: -100, y: -100 };
    const cur = { x: -100, y: -100, w: IDLE, h: IDLE };
    let target: Element | null = null;
    let visible = false;
    let suspended = false;
    let pressed = false;
    let lockedAt = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      const next = (e.target as Element | null)?.closest?.(TARGETS) ?? null;
      if (next !== target) {
        target = next;
        lockedAt = performance.now();
        const label = next?.getAttribute("data-af") ?? "";
        if (labelRef.current) labelRef.current.textContent = label;
      }
      if (!visible) {
        visible = true;
        cur.x = pointer.x - IDLE / 2;
        cur.y = pointer.y - IDLE / 2;
      }
    };
    const onLeave = () => {
      visible = false;
      target = null;
    };
    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);
    // The lightbox has its own cursor language (zoom, loupe)
    const onLightbox = (e: Event) => {
      suspended = !!(e as CustomEvent<{ open: boolean }>).detail?.open;
      html.classList.toggle("af-cursor", !suspended);
    };

    const clock = frameClock();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = clock(now);
      const root = rootRef.current;
      const box = boxRef.current;
      if (!root || !box) return;

      let tx: number, ty: number, tw: number, th: number;
      const locked = !!target && target.isConnected;
      if (locked) {
        const r = target!.getBoundingClientRect();
        const padding = 6;
        tx = r.left - padding;
        ty = r.top - padding;
        tw = r.width + padding * 2;
        th = r.height + padding * 2;
      } else {
        const s = pressed ? IDLE * 0.7 : IDLE;
        tx = pointer.x - s / 2;
        ty = pointer.y - s / 2;
        tw = s;
        th = s;
      }
      const k = smoothing(locked ? 0.22 : 0.35, dt);
      cur.x += (tx - cur.x) * k;
      cur.y += (ty - cur.y) * k;
      cur.w += (tw - cur.w) * k;
      cur.h += (th - cur.h) * k;

      root.style.opacity = visible && !suspended ? "1" : "0";
      box.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      box.style.width = `${cur.w}px`;
      box.style.height = `${cur.h}px`;
      // A short blink when focus is acquired, like a camera confirming lock
      const sinceLock = performance.now() - lockedAt;
      const blink = locked && sinceLock < 360 ? (Math.floor(sinceLock / 90) % 2 ? 0.35 : 1) : 1;
      box.style.opacity = String(blink);
      box.dataset.locked = locked ? "1" : "0";
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pointer.x - 2}px, ${pointer.y - 2}px, 0)`;
      }
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("photoLightbox", onLightbox);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("af-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("photoLightbox", onLightbox);
    };
  }, [enabled]);

  if (!enabled) return null;

  const corner = (pos: React.CSSProperties, rot: number) => (
    <span
      style={{
        position: "absolute",
        width: 10,
        height: 10,
        borderTop: "1.5px solid currentColor",
        borderLeft: "1.5px solid currentColor",
        transform: `rotate(${rot}deg)`,
        ...pos,
      }}
    />
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        pointerEvents: "none",
        mixBlendMode: "difference",
        color: "#fff",
        opacity: 0,
        transition: "opacity 0.25s ease",
      }}
    >
      <div ref={boxRef} className="af-box" style={{ position: "absolute", left: 0, top: 0, width: IDLE, height: IDLE }}>
        {corner({ left: 0, top: 0 }, 0)}
        {corner({ right: 0, top: 0 }, 90)}
        {corner({ right: 0, bottom: 0 }, 180)}
        {corner({ left: 0, bottom: 0 }, 270)}
        <div
          ref={labelRef}
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 8px)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 9,
            letterSpacing: "0.18em",
            whiteSpace: "nowrap",
          }}
        />
      </div>
      <div ref={dotRef} style={{ position: "absolute", left: 0, top: 0, width: 4, height: 4, borderRadius: 4, background: "#fff" }} />
    </div>
  );
}
