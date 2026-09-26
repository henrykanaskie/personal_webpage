import type { Metadata } from "next";
import { buildSections } from "../getPhotos";
import ExposureGame, { GamePhoto } from "./ExposureGame";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Guess the Exposure · Henry Kanaskie",
  description: "Look at a photograph and guess how it was shot. Every answer comes from the camera data in the frame.",
};

export default async function PlayPage() {
  const sections = await buildSections();
  const photos: GamePhoto[] = sections.flatMap((s) =>
    s.photos
      // A frame needs at least two recorded settings to make interesting rounds
      .filter((p) => [p.exif.shutter, p.exif.aperture, p.exif.iso, p.exif.focal].filter(Boolean).length >= 2)
      .map((photo) => ({ photo, sectionTitle: s.title })),
  );
  return <ExposureGame photos={photos} />;
}
