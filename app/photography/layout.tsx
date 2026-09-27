"use client";

import AfCursor from "@/components/photo/AfCursor";

export default function PhotographyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-3" style={{ minHeight: "100vh", position: "relative" }}>
      {/* Background and grain come from the persistent PhotographyBackground in the root layout */}
      <AfCursor />

      {/* Page content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          // Reserve space for the fixed top photography nav
          paddingTop: "calc(env(safe-area-inset-top) + 72px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
