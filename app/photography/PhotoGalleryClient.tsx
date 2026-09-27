"use client";

import { useMemo } from "react";
import { useIsDark } from "@/hooks/useIsDark";
import type { Section } from "@/app/photography/data";
import DepthWorld from "@/components/photo/DepthWorld";

export default function PhotoGalleryClient({ sections }: { sections: Section[] }) {
  const isDark = useIsDark();
  const live = useMemo(() => sections.filter((s) => s.photos.length > 0), [sections]);
  // Clicking anything in the flight goes into a chapter; the lightbox lives on the chapter pages
  return <DepthWorld sections={live} perSection={6} isDark={isDark} />;
}
