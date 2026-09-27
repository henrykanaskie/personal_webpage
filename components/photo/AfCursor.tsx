"use client";

import { useEffect, useRef, useState } from "react";
import { frameClock, smoothing } from "./utils";

const IDLE = 34;
const TARGETS = "[data-af], a, button";

/**
 * Autofocus-point cursor for the photography side (fine pointers only).
 * The brackets idle around the pointer, then snap and lock onto whatever they
 * hover, tracking its box while locked so moving and 3D-transformed photos stay
 * framed. The loop sleeps whenever the brackets have settled.
 */
export default function AfCursor() {
  const [enabled, setEnabled] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
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
    const clock = frameClock();

    const show = () => {
      const on = visible && !suspended ? "1" : "0";
      if (boxRef.current) boxRef.current.style.visibility = on === "1" ? "visible" : "hidden";
      if (dotRef.current) dotRef.current.style.visibility = on === "1" ? "visible" : "hidden";
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = clock(now);
      const box = boxRef.current;
      if (!box) return;

      let tx: number, ty: number, tw: number, th: number;
      const locked = !!target && target.isConnected;
      if (locked) {
        const r = target!.getBoundingClientRect();
        tx = r.left - 6;
        ty = r.top - 6;
        tw = r.width + 12;
        th = r.height + 12;
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

      box.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
      box.style.width = `${cur.w.toFixed(1)}px`;
      box.style.height = `${cur.h.toFixed(1)}px`;
      // A short blink when focus is acquired, like a camera confirming lock
      const sinceLock = now - lockedAt;
      box.style.opacity = locked && sinceLock < 360 ? (Math.floor(sinceLock / 90) % 2 ? "0.35" : "1") : "1";
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${pointer.x - 2}px, ${pointer.y - 2}px, 0)`;

      // Keep running while moving, blinking or locked onto something that may move; otherwise sleep
      const settled = Math.abs(tx - cur.x) + Math.abs(ty - cur.y) + Math.abs(tw - cur.w) + Math.abs(th - cur.h) < 0.4;
      if (!settled || locked) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      const next = (e.target as Element | null)?.closest?.(TARGETS) ?? null;
      if (next !== target) {
        target = next;
        lockedAt = performance.now();
      }
      if (!visible) {
        visible = true;
        cur.x = pointer.x - IDLE / 2;
        cur.y = pointer.y - IDLE / 2;
        show();
      }
      wake();
    };
    const onLeave = () => {
      visible = false;
      target = null;
      show();
    };
    const onDown = () => {
      pressed = true;
      wake();
    };
    const onUp = () => {
      pressed = false;
      wake();
    };
    // The lightbox has its own cursor language (zoom, loupe)
    const onLightbox = (e: Event) => {
      suspended = !!(e as CustomEvent<{ open: boolean }>).detail?.open;
      html.classList.toggle("af-cursor", !suspended);
      show();
    };

    show();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("photoLightbox", onLightbox);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("af-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", wake);
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
        borderTop: "1.5px solid #fff",
        borderLeft: "1.5px solid #fff",
        transform: `rotate(${rot}deg)`,
        ...pos,
      }}
    />
  );

  // Only these two small elements blend with the page, not a full-screen layer
  return (
    <>
      <div
        ref={boxRef}
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: IDLE,
          height: IDLE,
          zIndex: 9998,
          pointerEvents: "none",
          mixBlendMode: "difference",
          visibility: "hidden",
        }}
      >
        {corner({ left: 0, top: 0 }, 0)}
        {corner({ right: 0, top: 0 }, 90)}
        {corner({ right: 0, bottom: 0 }, 180)}
        {corner({ left: 0, bottom: 0 }, 270)}
      </div>
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 4,
          height: 4,
          borderRadius: 4,
          background: "#fff",
          zIndex: 9998,
          pointerEvents: "none",
          mixBlendMode: "difference",
          visibility: "hidden",
        }}
      />
    </>
  );
}
