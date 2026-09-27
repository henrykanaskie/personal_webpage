"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import CardHeader from "./CardHeader";
import { GlassCard } from "@/lib/glass";
import { rise, settle, leave } from "@/lib/motion";

interface EducationCardProps {
  school: string;
  degree: string;
  timeline: string;
  gpa?: string;
  coursework?: string[];
  /** A previous degree at the same school; GPA and coursework belong to it. */
  earlier?: { degree: string; timeline: string };
}

const label: React.CSSProperties = {
  fontSize: 9,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

export default function EducationCard({ school, degree, timeline, gpa, coursework, earlier }: EducationCardProps) {
  const isMobile = useIsMobile(1000);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: isMobile ? 0.15 : 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={rise.hidden}
      animate={isInView ? rise.shown : rise.hidden}
      exit={leave}
      transition={settle}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "clamp(140px, 16vw, 220px)",
      }}
      className="px-4 md:px-12 lg:px-20 mx-auto max-w-[1400px]"
    >
      <GlassCard className="p-5 md:p-10 lg:p-12">
        <CardHeader title={school} subtitle={degree} meta={timeline} metaWeight={400} />

        <div className="bg-black/[0.08] dark:bg-white/[0.1]" style={{ height: 1, margin: "8px 0 16px" }} />

        {/* The earlier degree, which the GPA and coursework below belong to */}
        {earlier && (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div
              className="font-[family-name:var(--font-elevated)]"
              style={{ fontSize: "clamp(0.95rem, 1.3vw, 1.125rem)", fontWeight: 500, color: "var(--body-ink)" }}
            >
              {earlier.degree}
            </div>
            <div
              className="font-[family-name:var(--font-elevated)]"
              style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-2)", marginTop: 2 }}
            >
              {earlier.timeline}
            </div>
          </div>
        )}

        {gpa && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span className="text-black/50 dark:text-white/50" style={label}>
              GPA
            </span>
            <div style={{ marginTop: 4 }}>
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: "var(--title-fill)",
                    fontSize: "clamp(1.25rem, 2vw, 1.75rem)",
                    fontWeight: 700,
                  }}
                >
                  {gpa}
                </span>
              </span>
            </div>
          </div>
        )}

        {coursework && coursework.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span className="text-black/50 dark:text-white/50" style={label}>
              Relevant Coursework
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 10,
                justifyContent: "center",
              }}
            >
              {coursework.map((course) => (
                <span
                  key={course}
                  className="text-black/80 dark:text-white/80 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]"
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-elevated)",
                    padding: "3px 8px",
                    borderRadius: 8,
                    letterSpacing: "0.04em",
                  }}
                >
                  {course}
                </span>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
