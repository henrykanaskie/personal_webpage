"use client";

import { useEffect, useState } from "react";

/**
 * Occupies the same height as the fixed #main-header so page content
 * starts below it. Automatically grows when the mobile dropdown opens.
 */
export default function HeaderSpacer() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const header = document.getElementById("main-header");
    if (!header) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      );
    });
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  return <div aria-hidden style={{ height }} />;
}
