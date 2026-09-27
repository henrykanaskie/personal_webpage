// ─── GlassLayers ────────────────────────────────────────────────────────────
// Decorates a .glass-panel: the glass edge (the same lip and thin film as the
// bubbles, .edge-ring) and a specular line along the top edge, both inside the
// rim mask, and a faint brushed sheen that catches light from the upper left.

export function GlassLayers({
  refractionSide = "left",
  specularInset = "8%",
}: {
  refractionSide?: "left" | "right";
  specularInset?: string;
} = {}) {
  const lightX = refractionSide === "left" ? "18%" : "82%";
  return (
    <>
      {/* the rim and the specular line sit in a mask the liquid swells can
          open (.ring-mask), so nothing on the edge crosses a swell */}
      <div className="ring-mask" style={{ zIndex: 1 }}>
        <div className="edge-ring" />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: specularInset,
            right: specularInset,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 70%, transparent)",
            opacity: 0.55,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(90% 60% at ${lightX} 0%, rgba(255,255,255,0.18), transparent 60%)`,
        }}
      />
    </>
  );
}

// ─── GlassCard ──────────────────────────────────────────────────────────────
// A liquid glass card: DotField frosts the dots under it and swells its edge
// toward the cursor ([data-liquid]); the content sits above the glass layers.

export function GlassCard({
  className = "",
  style,
  refractionSide,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  refractionSide?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", borderRadius: "24px", ...style }} data-liquid className={`glass-panel ${className}`}>
      <GlassLayers refractionSide={refractionSide} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
