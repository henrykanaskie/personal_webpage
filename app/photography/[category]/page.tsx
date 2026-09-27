import { notFound } from "next/navigation";
import { SECTION_META } from "../data";
import { buildSection, buildSections } from "../getPhotos";
import CategoryPageClient, { ChapterLink } from "./CategoryPageClient";

export function generateStaticParams() {
  return SECTION_META.map((s) => ({ category: s.id }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const section = await buildSection(category);
  if (!section) notFound();

  // Neighbouring chapters (only ones with photos) for the footer navigation
  const live = (await buildSections()).filter((s) => s.photos.length > 0);
  const at = live.findIndex((s) => s.id === section.id);
  const link = (i: number): ChapterLink | null => {
    const s = live[(i + live.length) % live.length];
    if (!s || s.id === section.id) return null;
    return { id: s.id, num: s.num, title: s.title, cover: s.photos[0] };
  };
  const next = live.length ? link(at === -1 ? 0 : at + 1) : null;

  return <CategoryPageClient section={section} next={next} />;
}
