"use client";

import { useState, Fragment, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsDark } from "@/hooks/useIsDark";
import { useIsMobile } from "@/hooks/useIsMobile";
import GlassTitle from "@/components/GlassTitle";
import { CS_SECTIONS, rememberCsSection, sectionLabel } from "@/lib/site";
import MiniFlight, { type MiniPrint } from "@/components/photo/MiniFlight";
import { photoTheme } from "@/components/photo/utils";
import { GRAIN } from "@/components/PhotographyBackground";

// ─── Divider: slow breathing pulse on hover ─────────────────────────────────

function AnimatedDivider({
  hovered,
  horizontal = false,
  dividerRef,
}: {
  hovered: "left" | "right" | null;
  horizontal?: boolean;
  dividerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const active = hovered !== null;
  const mid =
    hovered === "left"
      ? "rgba(200,185,155,0.65)"
      : hovered === "right"
        ? "rgba(165,185,220,0.6)"
        : "rgba(180,175,160,0.5)";

  return (
    <div
      ref={dividerRef}
      style={{
        position: "relative",
        width: horizontal ? "100%" : 1,
        height: horizontal ? 1 : undefined,
        flexShrink: 0,
        zIndex: 2,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${horizontal ? "to right" : "to bottom"}, transparent 3%, ${mid} 20%, ${mid} 80%, transparent 97%)`,
          opacity: 0.4,
          animation: active ? "dividerPulse 3s ease-in-out infinite" : "none",
          transition: active ? "none" : "opacity 0.8s ease",
        }}
      />
    </div>
  );
}

// ─── Photography panel ───────────────────────────────────────────────────────
// A small live version of the photography flight, in the photography palette.

function PhotoSide({
  active,
  isDark,
  isMobile,
  prints,
  chapters,
  onGo,
}: {
  active: boolean;
  isDark: boolean;
  isMobile: boolean;
  prints: MiniPrint[];
  chapters: { id: string; title: string }[];
  onGo: (chapter?: string) => void;
}) {
  const t = photoTheme(isDark);
  const halo = `0 0 28px ${t.bg}, 0 0 10px ${t.bg}`;

  return (
    <motion.div
      className="relative w-full h-full"
      animate={{ scale: active ? 1.018 : 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{ userSelect: "none", background: t.bg }}
    >
      <MiniFlight prints={prints} active={active} isDark={isDark} isMobile={isMobile} />

      {/* Film grain, the same cached tile the photography pages use */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: isDark ? 0.07 : 0.05 }}
      />

      {/* Name */}
      <div style={{ position: "absolute", top: "calc(50% - 70px)", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap" }}>
        <p
          style={{
            color: t.sub,
            fontFamily: "var(--font-elevated)",
            fontSize: "clamp(1rem, 1.8vw, 1.4rem)",
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            fontWeight: 500,
            margin: 0,
            textShadow: halo,
          }}
        >
          Henry Kanaskie
        </p>
      </div>

      {/* Title */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-elevated)",
            fontWeight: 300,
            fontSize: isMobile ? "clamp(2rem, 10vw, 3.4rem)" : "clamp(2.8rem, 5.2vw, 5rem)",
            letterSpacing: "-0.035em",
            lineHeight: 1,
            color: t.ink,
            textShadow: halo,
          }}
        >
          Photography
        </h1>
      </div>

      {/* Hairline divider */}
      <div
        style={{ position: "absolute", top: "calc(50% + 48px)", left: "50%", transform: "translateX(-50%)", width: 32, height: 1, background: t.rule }}
      />

      {/* Chapters, mirroring the CS half's sections: hidden on mobile */}
      {!isMobile && (
        <div
          style={{
            position: "absolute",
            top: "calc(50% + 72px)",
            left: "50%",
            transform: "translate(-50%,-50%)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          {chapters.map((c, i) => (
            <Fragment key={c.id}>
              <Link
                href={`/photography/${c.id}`}
                scroll={false}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onGo(c.id);
                }}
                className="photo-split-link"
                style={{
                  fontFamily: "var(--font-elevated)",
                  fontSize: 15,
                  color: t.sub,
                  textDecoration: "none",
                  padding: "4px 8px",
                  textShadow: halo,
                  ["--photo-ink" as string]: t.ink,
                }}
              >
                {c.title}
              </Link>
              {i < chapters.length - 1 && <span style={{ color: t.faint, fontSize: 9, lineHeight: 1 }}>·</span>}
            </Fragment>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── CS / Tech panel ─────────────────────────────────────────────────────────

function CSSide({
  active,
  isDark,
  isMobile,
  onGo,
}: {
  active: boolean;
  isDark: boolean;
  isMobile: boolean;
  onGo: (section: string) => void;
}) {
  const divColor = isDark ? "rgba(180,200,255,0.15)" : "rgba(80,100,140,0.18)";
  const dotColor = isDark ? "rgba(180,200,255,0.2)" : "rgba(80,100,140,0.22)";

  return (
    <motion.div
      className="relative w-full h-full"
      animate={{ scale: active ? 1.018 : 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Name */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% - 70px)",
          left: "50%",
          transform: "translate(-50%,-50%)",
          whiteSpace: "nowrap",
        }}
      >
        <p
          style={{
            color: "var(--ink-2)",
            fontFamily: "var(--font-elevated)",
            fontSize: "clamp(1rem, 1.8vw, 1.4rem)",
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            fontWeight: 500,
            margin: 0,
          }}
        >
          Henry Kanaskie
        </p>
      </div>

      {/* Title: crystalline */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      >
        <GlassTitle
          text="Computer Science"
          fontSize={isMobile ? "clamp(1.6rem, 8vw, 3rem)" : "clamp(2.6rem, 4.7vw, 4.6rem)"}
          containerClassName="!pt-0 !pb-0"
          disableEntrance
          noWrap
        />
      </div>

      {/* Hairline divider */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% + 48px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 32,
          height: 1,
          background: divColor,
        }}
      />

      {/* Horizontal nav: hidden on mobile */}
      {!isMobile && (
        <div
          style={{
            position: "absolute",
            top: "calc(50% + 72px)",
            left: "50%",
            transform: "translate(-50%,-50%)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            whiteSpace: "nowrap",
          }}
        >
          {CS_SECTIONS.map((id, i) => (
            <Fragment key={id}>
              <Link
                href="/cs"
                scroll={false}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onGo(id);
                }}
                className="metal-surface px-4 py-1.5 rounded-full font-semibold tracking-wide transition-transform duration-200 hover:-translate-y-px"
                style={{ fontSize: "15px" }}
              >
                <span>{sectionLabel(id)}</span>
              </Link>
              {i < CS_SECTIONS.length - 1 && (
                <span
                  style={{
                    color: dotColor,
                    fontSize: "9px",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  ·
                </span>
              )}
            </Fragment>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomeClient({ prints, chapters }: { prints: MiniPrint[]; chapters: { id: string; title: string }[] }) {
  const [hovered, setHovered] = useState<"left" | "right" | null>(null);
  const isMobile = !!useIsMobile();
  const isDark = useIsDark();
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Choosing a side expands it to fill the screen first, then navigates. The CS
  // half is already drawn on the dot paper the CS pages use, so its handoff has
  // no seam at all; the photography half fills with its own darkroom first.
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const go = (side: "left" | "right", section?: string) => {
    if (leaving) return;
    if (side === "right" && section) rememberCsSection(section);
    setLeaving(side);
    // A photography chapter link goes straight into that chapter
    const href = side === "left" ? (section ? `/photography/${section}` : "/photography") : "/cs";
    window.setTimeout(() => router.push(href), 420);
  };
  const flexFor = (side: "left" | "right") => {
    if (leaving) return leaving === side ? 1 : 0.0001;
    if (isMobile || !hovered) return 1;
    return hovered === side ? 1.6 : 0.5;
  };
  const panelTransition = leaving
    ? { duration: 0.42, ease: [0.65, 0, 0.35, 1] as const }
    : { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const };

  const inactiveDim = "brightness(0.62)";
  const dividerRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef<"left" | "right" | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
      }}
      onMouseMove={(e) => {
        if (isMobile) return;
        const dividerEl = dividerRef.current;
        if (!dividerEl) return;
        const dividerRect = dividerEl.getBoundingClientRect();
        const side: "left" | "right" = e.clientX < dividerRect.left ? "left" : "right";
        if (side !== hoveredRef.current) {
          hoveredRef.current = side;
          setHovered(side);
        }
      }}
      onMouseLeave={() => {
        hoveredRef.current = null;
        setHovered(null);
      }}
    >
      {/* Photography */}
      <motion.div
        animate={{
          flex: flexFor("left"),
          filter: hovered === "right" && !leaving ? inactiveDim : "brightness(1)",
        }}
        transition={panelTransition}
        style={{
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          cursor: "pointer",
        }}
        onClick={() => go("left")}
      >
        <PhotoSide
          active={hovered === "left"}
          isDark={isDark}
          isMobile={isMobile}
          prints={prints}
          chapters={chapters}
          onGo={(chapter) => go("left", chapter)}
        />
      </motion.div>

      <motion.div animate={{ opacity: leaving ? 0 : 1 }} transition={{ duration: 0.2 }} style={{ display: "flex", width: isMobile ? "100%" : undefined }}>
        <AnimatedDivider hovered={hovered} horizontal={isMobile} dividerRef={dividerRef} />
      </motion.div>

      {/* CS */}
      <motion.div
        animate={{
          flex: flexFor("right"),
          filter: hovered === "left" && !leaving ? inactiveDim : "brightness(1)",
        }}
        transition={panelTransition}
        style={{
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          cursor: "pointer",
        }}
        onClick={() => go("right")}
      >
        <CSSide
          active={hovered === "right"}
          isDark={isDark}
          isMobile={isMobile}
          onGo={(section) => go("right", section)}
        />
      </motion.div>
    </div>
  );
}
