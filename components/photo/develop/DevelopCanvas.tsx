"use client";

import { useEffect, useRef, useState } from "react";
import type { PhotoHistogram } from "@/app/photography/data";
import { DevelopEngine, type DevelopParams } from "./engine";

/**
 * Live, GPU-rendered edit of one photo, laid over the viewer's image. With
 * `split` set, the left of a draggable divider shows the original.
 */
export default function DevelopCanvas({
  src,
  params,
  split,
  onSplit,
  onHistogram,
  onError,
}: {
  src: string;
  params: DevelopParams;
  split: number | null;
  onSplit: (x: number) => void;
  onHistogram: (h: PhotoHistogram) => void;
  onError: (message: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DevelopEngine | null>(null);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef({ params, split });
  latest.current = { params, split };
  const histFrame = useRef(0);
  const dragging = useRef(false);

  // Engine lifetime follows the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      engineRef.current = new DevelopEngine(canvas);
    } catch {
      onError("Develop mode needs WebGL2, which this browser doesn't provide.");
      return;
    }
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      engineRef.current?.render(latest.current.params, latest.current.split ?? -1);
    });
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [onError]);

  // Load the photo into a texture
  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setImage(img);
      engine.render(latest.current.params, latest.current.split ?? -1);
      const h = engine.histogram(latest.current.params);
      if (h) onHistogram(h);
      setLoaded(true);
    };
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src, onHistogram]);

  // Redraw on every change; the histogram readback is coalesced to one per frame
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.ready) return;
    engine.render(params, split ?? -1);
    cancelAnimationFrame(histFrame.current);
    histFrame.current = requestAnimationFrame(() => {
      const h = engine.histogram(params);
      if (h) onHistogram(h);
    });
  }, [params, split, onHistogram]);

  const moveSplit = (clientX: number) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    onSplit(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };

  return (
    <div
      style={{ position: "absolute", inset: 0, touchAction: split !== null ? "none" : "auto" }}
      onPointerDown={(e) => {
        if (split === null) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        moveSplit(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && moveSplit(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease" }}
      />
      {split !== null && loaded && (
        <>
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${split * 100}%`,
              width: 2,
              marginLeft: -1,
              background: "#fff",
              boxShadow: "0 0 12px rgba(0,0,0,0.5)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 38,
                height: 38,
                transform: "translate(-50%, -50%)",
                borderRadius: 999,
                background: "rgba(10,10,14,0.7)",
                border: "1.5px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 13,
                backdropFilter: "blur(6px)",
              }}
            >
              ⇆
            </div>
          </div>
          {(["Before", "After"] as const).map((label, i) => (
            <span
              key={label}
              style={{
                position: "absolute",
                top: 12,
                [i ? "right" : "left"]: 12,
                padding: "5px 9px",
                borderRadius: 999,
                background: "rgba(10,10,14,0.6)",
                color: "#fff",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 8.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                pointerEvents: "none",
              }}
            >
              {label}
            </span>
          ))}
        </>
      )}
    </div>
  );
}
