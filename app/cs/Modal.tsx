"use client";

import { GlassLayers } from "@/lib/glass";

/** A glass sheet over a blurred, dimmed page. Clicking outside the sheet closes it. */
export default function Modal({
  isDark,
  onClose,
  className,
  children,
}: {
  isDark: boolean;
  onClose: () => void;
  /** Sizing for the sheet, e.g. its max width. */
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />
      <div
        className={`relative w-full ${className} max-h-[90vh] overflow-auto rounded-3xl glass-panel`}
        style={{ backgroundColor: isDark ? "rgba(14,16,20,0.72)" : "rgba(255,255,255,0.55)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassLayers />
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="metal-surface w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
      aria-label="Close"
    >
      ✕
    </button>
  );
}
