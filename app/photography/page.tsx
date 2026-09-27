import { buildHeroPlates, buildSections } from "./getPhotos";
import { HERO_PHOTOS } from "./data";
import PhotoGalleryClient from "./PhotoGalleryClient";

export const dynamic = "force-static";

export default async function PhotographyPage() {
  const [sections, plates] = await Promise.all([buildSections(), buildHeroPlates(HERO_PHOTOS)]);
  return <PhotoGalleryClient sections={sections} plates={plates} />;
}
