import { buildSections } from "./getPhotos";
import PhotoGalleryClient from "./PhotoGalleryClient";

export default async function PhotographyPage() {
  const sections = await buildSections();
  return <PhotoGalleryClient sections={sections} />;
}
