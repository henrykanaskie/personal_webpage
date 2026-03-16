import { buildSections } from "./getPhotos";
import PhotoGalleryClient from "./PhotoGalleryClient";

export const dynamic = "force-static";

export default async function PhotographyPage() {
  const sections = await buildSections();
  return <PhotoGalleryClient sections={sections} />;
}
