"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useIsDark } from "@/lib/glass";
import { HERO_PHOTOS, Section } from "@/app/photography/data";
import IrisHero, { HeroItem } from "@/components/photo/IrisHero";
import DepthArchive from "@/components/photo/DepthArchive";
import ChapterIndex from "@/components/photo/ChapterIndex";
import Lightbox, { LightboxItem } from "@/components/photo/Lightbox";

interface Open {
  items: LightboxItem[];
  index: number;
  origin: DOMRect | null;
}

export default function PhotoGalleryClient({ sections, plates }: { sections: Section[]; plates: Record<string, string> }) {
  const isDark = useIsDark();
  const [open, setOpen] = useState<Open | null>(null);

  const live = useMemo(() => sections.filter((s) => s.photos.length > 0), [sections]);

  const heroItems = useMemo<HeroItem[]>(() => {
    const picks: HeroItem[] = [];
    for (const key of HERO_PHOTOS) {
      for (const s of live) {
        const photo = s.photos.find((p) => p.src === `/photography/${key}`);
        if (photo) picks.push({ photo, sectionTitle: s.title, plate: plates[photo.src] });
      }
    }
    // Fall back to each chapter's first frame if the curated list is stale
    return picks.length ? picks : live.map((s) => ({ photo: s.photos[0], sectionTitle: s.title }));
  }, [live, plates]);

  if (heroItems.length === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      <IrisHero items={heroItems} isDark={isDark} />

      <DepthArchive
        sections={live}
        perSection={6}
        isDark={isDark}
        onOpen={(items, index, rect) => setOpen({ items, index, origin: rect })}
      />

      <ChapterIndex sections={sections} isDark={isDark} />

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
