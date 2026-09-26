"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PhotoEntry } from "@/app/photography/data";
import { aspect, exposureLine, pad2 } from "./utils";

/**
 * A print that develops as it enters the viewport: it starts as a washed-out,
 * low-contrast sheet tinted with the photo's dominant colour and settles into
 * the final image, the way paper comes up in a darkroom tray. On hover it tilts
 * toward the pointer with a moving specular highlight and shows its exposure.
 */
export default function DevelopTile({
  photo,
  index,
  alt,
  isDark,
  priority,
  onOpen,
}: {
  photo: PhotoEntry;
  index: number;
  alt: string;
  isDark: boolean;
  priority?: boolean;
  onOpen: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const [hover, setHover] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-9, 9]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.32), rgba(255,255,255,0) 55%)`,
  );

  const exposure = exposureLine(photo.exif);
  // Deterministic stagger so neighbouring prints don't develop in lockstep
  const delay = ((index * 7) % 5) * 0.12;

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        data-af={exposure || `Frame ${pad2(index + 1)}`}
        role="button"
        tabIndex={0}
        aria-label={`Open ${alt}`}
        onClick={() => ref.current && onOpen(ref.current.getBoundingClientRect())}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && ref.current) {
            e.preventDefault();
            onOpen(ref.current.getBoundingClientRect());
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
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          aspectRatio: String(aspect(photo)),
          borderRadius: 3,
          overflow: "hidden",
          cursor: "pointer",
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          background: photo.blur ? `center / cover no-repeat url(${photo.blur}), ${photo.color}` : photo.color,
          boxShadow: hover
            ? `0 30px 60px -18px ${photo.color}aa, 0 0 0 1px ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`
            : `0 8px 24px -12px rgba(0,0,0,${isDark ? 0.7 : 0.25}), 0 0 0 1px ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
          transition: "box-shadow 0.5s ease",
        }}
      >
        <motion.div
          initial={{ filter: "sepia(0.9) brightness(2.1) contrast(0.35) blur(8px)", scale: 1.08 }}
          animate={inView ? { filter: "sepia(0) brightness(1) contrast(1) blur(0px)", scale: hover ? 1.06 : 1 } : {}}
          transition={{
            filter: { duration: 2.2, delay: delay + 0.15, ease: [0.3, 0.6, 0.2, 1] },
            scale: { duration: hover ? 0.8 : 2.2, delay: hover ? 0 : delay, ease: [0.22, 1, 0.36, 1] },
          }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Image
            src={photo.src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 40vw, 50vw"
            style={{ objectFit: "cover" }}
            priority={priority}
          />
        </motion.div>

        {/* Developer tint washing off */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0.85 }}
          animate={inView ? { opacity: 0 } : {}}
          transition={{ duration: 1.8, delay: delay + 0.1, ease: "easeOut" }}
          style={{ position: "absolute", inset: 0, background: photo.color, mixBlendMode: "color", pointerEvents: "none" }}
        />

        {/* Specular glare */}
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: glare,
            opacity: hover ? 1 : 0,
            mixBlendMode: "soft-light",
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        />

        {/* Exposure readout */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "28px 12px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 8,
            background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
            color: "rgba(255,255,255,0.9)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 8.5,
            letterSpacing: "0.16em",
            opacity: hover ? 1 : 0,
            transform: hover ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.35s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{exposure}</span>
          <span style={{ opacity: 0.6 }}>{pad2(index + 1)}</span>
        </div>
      </motion.div>
    </div>
  );
}
