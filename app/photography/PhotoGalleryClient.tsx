"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useIsDark } from "@/lib/glass";
import type { Section } from "@/app/photography/data";
import DepthWorld from "@/components/photo/DepthWorld";
import Lightbox, { LightboxItem } from "@/components/photo/Lightbox";

interface Open {
  items: LightboxItem[];
  index: number;
  origin: DOMRect | null;
}

export default function PhotoGalleryClient({ sections }: { sections: Section[] }) {
  const isDark = useIsDark();
  const [open, setOpen] = useState<Open | null>(null);
  const live = useMemo(() => sections.filter((s) => s.photos.length > 0), [sections]);

  return (
    <>
      <DepthWorld sections={live} perSection={6} isDark={isDark} onOpen={(items, index, rect) => setOpen({ items, index, origin: rect })} />

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
    </>
  );
}
