import { notFound } from "next/navigation";
import { SECTION_META } from "../data";
import { buildSection } from "../getPhotos";
import CategoryPageClient from "./CategoryPageClient";

export function generateStaticParams() {
  return SECTION_META.map((s) => ({ category: s.id }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const section = await buildSection(category);
  if (!section) notFound();
  return <CategoryPageClient section={section!} />;
}
