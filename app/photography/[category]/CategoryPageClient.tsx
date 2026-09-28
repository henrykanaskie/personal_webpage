"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useIsDark } from "@/hooks/useIsDark";
import type { Section, PhotoEntry } from "../data";
import DevelopTile from "@/components/photo/DevelopTile";
import FadeImage from "@/components/photo/FadeImage";
import Lightbox, { LightboxItem } from "@/components/photo/Lightbox";
import { MONO, EASE_OUT, aspect, chapterTitleSize, chapterTitleStroke, coverSrc, photoTheme, preloadImage } from "@/components/photo/utils";
import { diveArriving } from "@/components/photo/dive";

export interface ChapterLink {
  id: string;
  num: string;
  title: string;
  cover: PhotoEntry;
}

/**
 * Distribute photos into masonry columns, alternating portrait and landscape
 * frames so no column ends up all tall prints, then read them back row by row
 * so keyboard and lightbox order follow what the eye sees.
 */
function layoutColumns(photos: PhotoEntry[], numCols: number) {
  const portraits = photos.filter((p) => aspect(p) < 1);
  const landscapes = photos.filter((p) => aspect(p) >= 1);
  const interleaved: PhotoEntry[] = [];
  let pi = 0,
    li = 0,
    pickPortrait = true;
  while (pi < portraits.length || li < landscapes.length) {
    if (pickPortrait && pi < portraits.length) interleaved.push(portraits[pi++]);
    else if (li < landscapes.length) interleaved.push(landscapes[li++]);
    else if (pi < portraits.length) interleaved.push(portraits[pi++]);
    pickPortrait = !pickPortrait;
  }

  const cols: PhotoEntry[][] = Array.from({ length: numCols }, () => []);
  const heights = new Array(numCols).fill(0);
  for (const photo of interleaved) {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(photo);
    heights[shortest] += 1 / aspect(photo);
  }

  const order: PhotoEntry[] = [];
  const maxRows = Math.max(0, ...cols.map((c) => c.length));
  for (let row = 0; row < maxRows; row++) {
    for (const col of cols) if (row < col.length) order.push(col[row]);
  }

  // Wider columns for columns that hold wider photos, so rows stay balanced
  const flex = cols.map((col) => {
    if (col.length === 0) return 1;
    const mean = col.reduce((acc, p) => acc + aspect(p), 0) / col.length;
    return 0.5 + 0.5 * mean;
  });
  return { cols, order, flex };
}

export default function CategoryPageClient({ section, next }: { section: Section; next: ChapterLink | null }) {
  const isDark = useIsDark();
  const t = photoTheme(isDark);
  const [numCols, setNumCols] = useState(3);
  const [open, setOpen] = useState<{ index: number; origin: DOMRect | null } | null>(null);
  const [barHover, setBarHover] = useState<number | null>(null);
  const [nextHover, setNextHover] = useState(false);
  const photos = section.photos;
  const cover = photos[0];
  // Optimised, resized copy for the photo-filled title instead of the 2400px original
  const coverUrl = cover ? coverSrc(cover) : undefined;
  // Arriving from the flight, the title you clicked is flown into this heading's place (dive.ts), so
  // the heading is already where it belongs and doesn't play its own entrance on top of that
  const [arriving] = useState(() => diveArriving(`/photography/${section.id}`));
  // The title is filled with the cover photo, so it rises only once that photo can paint; without
  // this it showed as a dim outline and then popped. The flight preloads it, so this is usually instant.
  const [coverReady, setCoverReady] = useState(!coverUrl);
  useEffect(() => {
    if (!coverUrl) return;
    let live = true;
    const done = () => live && setCoverReady(true);
    preloadImage(coverUrl).then(done);
    const fallback = window.setTimeout(done, 900);
    return () => {
      live = false;
      window.clearTimeout(fallback);
    };
  }, [coverUrl]);

  useLayoutEffect(() => {
    // Enough columns that the tallest print still fits on screen (before the first paint: deciding
    // after it re-laid out the grid, 3 columns to 2 on phones, right after arriving)
    const maxHW = photos.reduce((m, p) => Math.max(m, 1 / aspect(p)), 1);
    const check = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const content = vw - Math.min(Math.max(18, vw * 0.05), 72) * 2;
      let cols = vw < 540 ? 2 : 3;
      while (cols < 5) {
        const colW = (content - 14 * (cols - 1)) / cols;
        if (colW * maxHW < vh * 0.9) break;
        cols++;
      }
      setNumCols(cols);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [photos]);

  const { cols, order, flex } = useMemo(() => layoutColumns(photos, numCols), [photos, numCols]);
  const items = useMemo<LightboxItem[]>(
    () => order.map((photo) => ({ photo, sectionId: section.id, sectionTitle: section.title })),
    [order, section.id, section.title],
  );

  const titleSize = chapterTitleSize(section.title);

  return (
    <>
      <div style={{ position: "relative", padding: "clamp(28px, 6vw, 64px) clamp(18px, 5vw, 72px) 0" }}>
        {/* Top rail */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          style={{ ...MONO, fontSize: 9, color: t.sub, display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Link href="/photography" style={{ color: t.sub, textDecoration: "none", display: "inline-flex", gap: 10, alignItems: "center" }}>
            <span style={{ letterSpacing: 0, fontSize: 12 }}>←</span> All chapters
          </Link>
        </motion.div>

        {/* Title filled with the chapter's own photograph */}
        <header style={{ marginTop: "clamp(40px, 9vh, 110px)", marginBottom: "clamp(28px, 5vh, 56px)" }}>
          {/* The reveal mask and the photo fill both stop at the element's box, so the box is padded
              out past the glyphs' ascenders and descenders; negative margins keep the spacing the same */}
          <div style={{ overflow: "hidden", margin: "-0.14em 0 -0.18em" }}>
            <motion.h1
              initial={arriving ? false : { y: "100%", opacity: 0 }}
              animate={arriving || coverReady ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                margin: 0,
                fontFamily: "var(--font-elevated)",
                fontWeight: 500,
                fontSize: titleSize,
                lineHeight: 0.86,
                padding: "0.14em 0.06em 0.18em 0",
                letterSpacing: "-0.045em",
                color: "transparent",
                backgroundImage: coverUrl ? `url("${coverUrl}")` : undefined,
                backgroundColor: cover ? undefined : t.ink,
                backgroundSize: "140% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                backgroundPosition: "50% 45%",
                WebkitTextStroke: `1px ${chapterTitleStroke(isDark)}`,
              }}
            >
              {section.title}
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE_OUT }}
            style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginTop: 22 }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-elevated)",
                fontSize: "clamp(1rem, 1.6vw, 1.35rem)",
                color: t.sub,
                fontWeight: 300,
              }}
            >
              {section.sub}
            </p>
          </motion.div>
        </header>

        {/* Colour barcode: one bar per frame, in reading order */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ marginBottom: "clamp(36px, 6vh, 64px)" }}
          >
            <div style={{ display: "flex", height: 30, gap: 2 }} onPointerLeave={() => setBarHover(null)}>
              {order.map((p, i) => (
                <motion.button
                  type="button"
                  key={p.src}
                  aria-label={`Open frame ${i + 1}`}
                  data-af=""
                  onPointerEnter={() => setBarHover(i)}
                  onClick={(e) => setOpen({ index: i, origin: e.currentTarget.getBoundingClientRect() })}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: barHover === i ? 1.6 : 1 }}
                  transition={{ duration: barHover === i ? 0.35 : 0.7, delay: barHover === null ? 0.55 + i * 0.025 : 0, ease: EASE_OUT }}
                  style={{
                    flex: 1,
                    padding: 0,
                    border: "none",
                    borderRadius: 2,
                    cursor: "pointer",
                    transformOrigin: "bottom",
                    background: `linear-gradient(to bottom, ${p.palette[0] ?? p.color}, ${p.palette[1] ?? p.color} 60%, ${p.palette[2] ?? p.color})`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Masonry */}
        {photos.length > 0 ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {cols.map((col, c) => (
              <div key={c} style={{ flex: flex[c], display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                {col.map((photo) => {
                  const i = order.indexOf(photo);
                  return (
                    <DevelopTile
                      key={photo.src}
                      photo={photo}
                      alt={photo.alt ?? `${section.title} photograph ${i + 1}`}
                      isDark={isDark}
                      priority={i < 3}
                      onOpen={(rect) => setOpen({ index: i, origin: rect })}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "12vh 0", color: t.sub }}>
            <div style={{ ...MONO, fontSize: 9.5 }}>This roll is still in the developer</div>
            <div
              style={{
                fontFamily: "var(--font-elevated)",
                fontSize: "clamp(1.2rem, 2.4vw, 2rem)",
                color: t.ink,
                marginTop: 14,
                fontWeight: 300,
              }}
            >
              Check back soon.
            </div>
          </div>
        )}
      </div>

      {/* Next chapter */}
      {next && (
        <Link
          href={`/photography/${next.id}`}
          data-af={`Chapter ${next.num}`}
          onPointerEnter={() => setNextHover(true)}
          onPointerLeave={() => setNextHover(false)}
          style={{
            display: "block",
            position: "relative",
            marginTop: "clamp(80px, 14vh, 160px)",
            height: "clamp(260px, 52vh, 520px)",
            overflow: "hidden",
            textDecoration: "none",
            borderTop: `1px solid ${t.rule}`,
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              clipPath: nextHover ? "inset(0% 0% 0% 0%)" : "inset(38% 30% 38% 30%)",
              transition: "clip-path 1s cubic-bezier(0.22,1,0.36,1)",
              background: next.cover.color,
            }}
          >
            <FadeImage
              src={next.cover.src}
              alt=""
              fill
              sizes="100vw"
              style={{
                objectFit: "cover",
                transform: nextHover ? "scale(1)" : "scale(1.25)",
                transition: "transform 1.4s cubic-bezier(0.22,1,0.36,1)",
                filter: nextHover ? "none" : "grayscale(1) contrast(1.1)",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              color: "#fff",
              mixBlendMode: "difference",
              pointerEvents: "none",
            }}
          >
            <span style={{ ...MONO, fontSize: 9.5 }}>Next chapter · {next.num}</span>
            <span
              style={{
                fontFamily: "var(--font-elevated)",
                fontWeight: 300,
                fontSize: `clamp(2.4rem, ${Math.min(12, 110 / next.title.length).toFixed(1)}vw, 10rem)`,
                letterSpacing: nextHover ? "0.02em" : "-0.03em",
                transition: "letter-spacing 0.9s cubic-bezier(0.22,1,0.36,1)",
                lineHeight: 1,
              }}
            >
              {next.title} →
            </span>
          </div>
        </Link>
      )}

      <AnimatePresence>
        {open && items.length > 0 && (
          <Lightbox
            key="lightbox"
            items={items}
            index={open.index}
            origin={open.origin}
            isDark={isDark}
            onIndex={(index) => setOpen((o) => (o ? { ...o, index } : o))}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
