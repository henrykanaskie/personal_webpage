"use client";

import {
  glassStyle,
  GlassLayers,
  FuzzyText,
  useIsDark,
} from "../lib/glass";
import { glassBoxClassNames, cs, themed } from "../lib/tokens";

interface AboutBlurbProps {
  about?: string;
}

export default function AboutBlurb({ about }: AboutBlurbProps) {
  const isDark = useIsDark();

  return (
    <div style={{ position: "relative", width: "100%", marginRight: "clamp(0px, 3vw, 2.5rem)" }}>
      <div
        style={{
          position: "relative",
          borderRadius: "24px",
          ...glassStyle,
        }}
        className={`${glassBoxClassNames} p-5 md:p-10 lg:p-12`}
      >
        <GlassLayers refractionSide="left" />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            className="font-[family-name:var(--font-elevated)]"
            style={{
              marginTop: 0,
              marginBottom: 0,
              fontSize: "clamp(0.9375rem, 1.3vw, 1.1875rem)",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              lineHeight: 1.7,
              color: themed(isDark, cs.bodyColor.dark, cs.bodyColor.light),
            }}
          >
            <FuzzyText>{about}</FuzzyText>
          </p>
        </div>
      </div>
    </div>
  );
}
