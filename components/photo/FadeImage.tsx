"use client";

import Image, { type ImageProps } from "next/image";

/**
 * A photo that fades in once it has actually loaded, over whatever colour its
 * container shows. Used everywhere instead of blur-up placeholders, so nothing
 * flashes from blurry to sharp.
 */
export default function FadeImage({ style, onLoad, ...props }: ImageProps) {
  return (
    <Image
      {...props}
      onLoad={(e) => {
        e.currentTarget.style.opacity = "1";
        onLoad?.(e);
      }}
      style={{ opacity: 0, transition: "opacity 0.6s ease", ...style }}
    />
  );
}
