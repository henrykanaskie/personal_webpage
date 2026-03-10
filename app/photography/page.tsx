import { buildSections } from "./getPhotos";
import PhotoGalleryClient from "./PhotoGalleryClient";

export default function PhotographyPage() {
  const sections = buildSections();
  return <PhotoGalleryClient sections={sections} />;
}
