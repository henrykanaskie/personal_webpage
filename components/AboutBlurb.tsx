"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

import {
  glassStyle,
  GlassLayers,
  FuzzyText,
  useIsMobile,
  useIsDark,
} from "../lib/glass";
import { glassBoxClassNames, cs, themed } from "../lib/tokens";

interface AboutBlurbProps {
  about?: string;
}

export default function AboutBlurb({ about }: AboutBlurbProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(1000);
  const isDark = useIsDark();
  const isInView = useInView(boxRef, {
    once: false,
    amount: isMobile ? 0.15 : 0.1,
  });

  return (
    <div
      ref={boxRef}
      style={{ position: "relative", width: "100%" }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
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
              fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)",
              fontWeight: 700,
              letterSpacing: "-0.005em",
              lineHeight: 1.6,
            }}
          >
            <FuzzyText>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: themed(isDark, cs.body.dark, cs.body.light),
                }}
              >
                {about}
              </span>
            </FuzzyText>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
