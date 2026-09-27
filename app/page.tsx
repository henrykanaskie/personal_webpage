import { buildSections } from "./photography/getPhotos";
import HomeClient from "./HomeClient";
import type { MiniPrint } from "@/components/photo/MiniFlight";

export const dynamic = "force-static";

export default async function HomePage() {
  const sections = (await buildSections()).filter((s) => s.photos.length > 0);
  // Two prints from each chapter for the split screen's small flight
  const prints: MiniPrint[] = sections.flatMap((s) =>
    [0, Math.floor(s.photos.length / 2)].map((k) => {
      const p = s.photos[k];
      return { src: p.src, color: p.color, aspect: p.width / p.height };
    }),
  );
  const chapters = sections.map((s) => ({ id: s.id, title: s.title }));
  return <HomeClient prints={prints} chapters={chapters} />;
}
