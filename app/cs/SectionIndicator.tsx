"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CS_SECTIONS, type CsSection } from "@/lib/site";

/**
 * Where the reader is on the CS page: the section whose top is above the
 * middle of the viewport, whether they've scrolled at all yet, and a ref for
 * the indicator's progress fill, which is written directly on every scroll
 * tick rather than through React state.
 */
export function useSectionScroll() {
  const [active, setActive] = useState<CsSection>("about");
  const [hasScrolled, setHasScrolled] = useState(false);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const N = CS_SECTIONS.length;

    // Cache section positions: only recomputed on resize, not on every scroll
    let sectionTops: number[] = new Array(N).fill(0);
    let lastSectionBottom = 0;

    const measureSections = () => {
      const scrollY = window.scrollY;
      sectionTops = CS_SECTIONS.map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + scrollY : 0;
      });
      const lastEl = document.getElementById(CS_SECTIONS[N - 1]);
      lastSectionBottom = lastEl ? lastEl.getBoundingClientRect().bottom + scrollY : sectionTops[N - 1] + window.innerHeight;
    };

    const update = () => {
      const scrollY = window.scrollY;
      const viewportMid = scrollY + window.innerHeight * 0.5;

      if (scrollY > 80) setHasScrolled(true);

      // Active section: highest top that is <= viewport center
      let activeIdx = 0;
      for (let i = 0; i < N; i++) {
        if (sectionTops[i] <= viewportMid) activeIdx = i;
      }
      setActive(CS_SECTIONS[activeIdx]);

      // Progress bar: pure math, no DOM reads
      const currentTop = sectionTops[activeIdx];
      const nextTop = activeIdx < N - 1 ? sectionTops[activeIdx + 1] : lastSectionBottom;
      const fraction = nextTop > currentTop ? Math.max(0, Math.min(1, (viewportMid - currentTop) / (nextTop - currentTop))) : 0;
      const progress = Math.max(0, Math.min(1, (activeIdx + fraction) / (N - 1)));
      if (fillRef.current) {
        fillRef.current.style.height = `calc(${progress * 100}% - ${progress * 15}px)`;
      }
    };

    measureSections();
    update();

    const onResize = () => {
      measureSections();
      update();
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return { active, hasScrolled, fillRef };
}

/** The fixed index down the right edge: the section's name, a bead per section, and a progress line. */
export default function SectionIndicator({
  active,
  fillRef,
  isDark,
}: {
  active: CsSection;
  fillRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
}) {
  return (
    <div
      className="hidden md:flex flex-col items-center"
      style={{
        position: "fixed",
        right: 18,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 40,
        gap: 0,
      }}
    >
      {/* Morphing section name */}
      <div
        style={{
          marginBottom: 14,
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={active}
            initial={{ opacity: 0, filter: "blur(8px)", y: -4 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(8px)", y: 4 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 700,
              backgroundImage: "var(--title-fill)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "none",
            }}
          >
            {active}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Beads + progress track */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Background track */}
        <div
          style={{
            position: "absolute",
            top: "7.5px",
            bottom: "7.5px",
            left: "50%",
            width: 1,
            transform: "translateX(-50%)",
            background: isDark ? "rgba(180,200,255,0.08)" : "rgba(100,115,145,0.08)",
          }}
        />
        {/* Glowing fill */}
        <div
          ref={fillRef}
          style={{
            position: "absolute",
            top: "7.5px",
            left: "50%",
            width: 1,
            height: "0%",
            transform: "translateX(-50%)",
            background: isDark
              ? "linear-gradient(to bottom, rgba(180,200,255,0.9), rgba(210,185,230,0.7))"
              : "linear-gradient(to bottom, rgba(100,115,145,0.8), rgba(125,110,135,0.6))",
            boxShadow: isDark
              ? "0 0 4px rgba(180,200,255,0.7), 0 0 10px rgba(210,185,230,0.35)"
              : "0 0 4px rgba(100,115,145,0.55), 0 0 8px rgba(125,110,135,0.3)",
          }}
        />
        {CS_SECTIONS.map((id) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              style={{
                position: "relative",
                zIndex: 1,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <motion.div
                className={isActive ? "metal-bead" : undefined}
                animate={{
                  width: isActive ? 9 : 3,
                  height: isActive ? 9 : 3,
                  opacity: isActive ? 1 : 0.35,
                }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                style={{
                  borderRadius: "50%",
                  background: isActive ? undefined : "var(--ink)",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
