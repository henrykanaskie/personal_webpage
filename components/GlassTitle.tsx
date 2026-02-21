"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function GlassTitle({ text = "experience" }: { text?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="flex justify-center pt-12 md:pt-18 select-none"
    >
      <span
        className="relative font-extrabold tracking-tight leading-none"
        style={{
          fontSize: "clamp(4rem, 11vw, 10rem)",
          letterSpacing: "-0.02em",
        }}
      >
        {/* Base pearlescent text */}
        <span
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: `linear-gradient(
              135deg,
              rgba(100,115,145,0.55) 0%,
              rgba(125,110,135,0.44) 15%,
              rgba(105,130,150,0.5) 30%,
              rgba(130,115,130,0.42) 45%,
              rgba(100,125,145,0.48) 60%,
              rgba(120,110,140,0.44) 75%,
              rgba(105,120,148,0.5) 90%,
              rgba(128,115,135,0.44) 100%
            )`,
            textShadow: `
              0 1px 2px rgba(0,0,0,0.06),
              0 4px 8px rgba(0,0,0,0.04),
              0 1px 0 rgba(255,255,255,0.15),
              2px 0 8px rgba(255,0,80,0.04),
              -2px 0 8px rgba(0,100,255,0.04),
              0 2px 8px rgba(255,200,0,0.03),
              0 -2px 8px rgba(0,200,255,0.03)
            `,
          }}
        >
          {text}
        </span>

        {/* Dark mode pearlescent overlay */}
        <span
          aria-hidden
          className="absolute inset-0 bg-clip-text text-transparent pointer-events-none opacity-0 dark:opacity-100"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: `linear-gradient(
              135deg,
              rgba(180,200,255,0.013) 0%,
              rgba(210,185,230,0.009) 15%,
              rgba(180,210,235,0.011) 30%,
              rgba(215,190,215,0.008) 45%,
              rgba(170,200,230,0.01) 60%,
              rgba(200,185,225,0.009) 75%,
              rgba(180,195,235,0.011) 90%,
              rgba(210,185,220,0.009) 100%
            )`,
          }}
        >
          {text}
        </span>

        {/* Shine — plays once on load */}
        <span
          aria-hidden
          className="absolute inset-0 bg-clip-text text-transparent pointer-events-none"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: `linear-gradient(
              105deg,
              transparent 0%,
              transparent 35%,
              rgba(255,255,255,0.25) 45%,
              rgba(255,255,255,0.35) 50%,
              rgba(255,255,255,0.25) 55%,
              transparent 65%,
              transparent 100%
            )`,
            backgroundSize: "250% 100%",
            animation: "glassShineIntro 2.5s ease-in-out forwards",
          }}
        >
          {text}
        </span>
      </span>
    </motion.div>
  );
}
