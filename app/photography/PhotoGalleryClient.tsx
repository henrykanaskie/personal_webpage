"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsDark } from "@/lib/glass";
import { HERO_PHOTOS, Section } from "@/app/photography/data";
import IrisHero, { HeroItem } from "@/components/photo/IrisHero";
import DepthArchive from "@/components/photo/DepthArchive";
import ChapterIndex from "@/components/photo/ChapterIndex";
import ExposureSpace from "@/components/photo/ExposureSpace";
import Colophon from "@/components/photo/Colophon";
import Lightbox, { LightboxItem } from "@/components/photo/Lightbox";
import { EASE_OUT, photoTheme } from "@/components/photo/utils";

interface Open {
  items: LightboxItem[];
  index: number;
  origin: DOMRect | null;
}

export default function PhotoGalleryClient({ sections }: { sections: Section[] }) {
  const isDark = useIsDark();
  const t = photoTheme(isDark);
  const [open, setOpen] = useState<Open | null>(null);

  const live = useMemo(() => sections.filter((s) => s.photos.length > 0), [sections]);
  const totalFrames = live.reduce((n, s) => n + s.photos.length, 0);

  const heroItems = useMemo<HeroItem[]>(() => {
    const picks: HeroItem[] = [];
    for (const key of HERO_PHOTOS) {
      for (const s of live) {
        const photo = s.photos.find((p) => p.src === `/photography/${key}`);
        if (photo) picks.push({ photo, sectionTitle: s.title });
      }
    }
    // Fall back to each chapter's first frame if the curated list is stale
    return picks.length ? picks : live.map((s) => ({ photo: s.photos[0], sectionTitle: s.title }));
  }, [live]);

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  };

  if (heroItems.length === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      <IrisHero items={heroItems} totalFrames={totalFrames} chapters={live.length} isDark={isDark} />

      {/* Statement */}
      <section style={{ padding: "clamp(90px, 18vh, 200px) clamp(18px, 5vw, 72px)", maxWidth: 1200, margin: "0 auto" }}>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          style={{
            fontFamily: "var(--font-elevated)",
            fontWeight: 300,
            fontSize: "clamp(1.6rem, 4.2vw, 3.6rem)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: t.ink,
            margin: 0,
            maxWidth: "18em",
          }}
        >
          Faces, mountains, neon, starlight and steel.{" "}
          <span style={{ color: t.faint }}>A working archive of the light I happened to be standing in.</span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{ ...mono, fontSize: 9.5, color: t.sub, marginTop: 36, display: "flex", gap: 14, alignItems: "center" }}
        >
          <span style={{ width: 40, height: 1, background: t.rule }} />
          Keep scrolling to walk through it
        </motion.div>
      </section>

      <DepthArchive
        sections={live}
        perSection={4}
        isDark={isDark}
        onOpen={(items, index, rect) => setOpen({ items, index, origin: rect })}
      />

      <ExposureSpace sections={live} isDark={isDark} onOpen={(items, index, rect) => setOpen({ items, index, origin: rect })} />

      <ChapterIndex sections={sections} isDark={isDark} />

      <Colophon isDark={isDark} />

      <AnimatePresence>
        {open && (
          <Lightbox
            key="lightbox"
            items={open.items}
            index={open.index}
            origin={open.origin}
            isDark={isDark}
            onIndex={(index) => setOpen((o) => (o ? { ...o, index } : o))}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
