"use client";

import { useRef, useState } from "react";
import FadeImage from "./FadeImage";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PhotoEntry } from "@/app/photography/data";
import { aspect } from "./utils";

/**
 * A print in the chapter grid. It sits on its own dominant colour until the
 * photo loads, then the photo fades in. On hover it tilts toward the pointer
 * with a moving highlight. Everything animated is transform or opacity.
 */
export default function DevelopTile({
  photo,
  alt,
  isDark,
  priority,
  onOpen,
}: {
  photo: PhotoEntry;
  alt: string;
  isDark: boolean;
  priority?: boolean;
  onOpen: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [6, -6]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-8, 8]), spring);
  // The highlight is a fixed gradient moved with a transform, not a redrawn background
  const glareX = useTransform(px, [0, 1], ["-25%", "25%"]);
  const glareY = useTransform(py, [0, 1], ["-25%", "25%"]);

  const open = () => ref.current && onOpen(ref.current.getBoundingClientRect());

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        data-af=""
        role="button"
        tabIndex={0}
        aria-label={`Open ${alt}`}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => {
          setHover(false);
          px.set(0.5);
          py.set(0.5);
        }}
        style={{
          position: "relative",
          aspectRatio: String(aspect(photo)),
          borderRadius: 3,
          overflow: "hidden",
          cursor: "pointer",
          rotateX,
          rotateY,
          background: photo.color,
          boxShadow: `0 10px 30px -14px rgba(0,0,0,${isDark ? 0.7 : 0.28}), 0 0 0 1px ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <motion.div
          animate={{ scale: hover ? 1.05 : 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "absolute", inset: 0 }}
        >
          <FadeImage
            src={photo.src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 40vw, 50vw"
            style={{ objectFit: "cover" }}
            priority={priority}
          />
        </motion.div>

        {/* Moving highlight */}
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-50%",
            x: glareX,
            y: glareY,
            background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%)",
            opacity: hover ? 1 : 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        />
      </motion.div>
    </div>
  );
}
