"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { glassStyle, GlassLayers, FuzzyText, useIsDark, useIsMobile } from "../lib/glass";
import { glassBoxClassNames, cs, themed } from "../lib/tokens";

interface EducationCardProps {
  school: string;
  degree: string;
  timeline: string;
  gpa?: string;
  coursework?: string[];
  extras?: string;
}

export default function EducationCard({
  school,
  degree,
  timeline,
  gpa,
  coursework,
  extras,
}: EducationCardProps) {
  const isDark = useIsDark();
  const isMobile = useIsMobile(1000);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: isMobile ? 0.15 : 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ x: "-70vw" }}
      animate={
        isInView
          ? { x: 0, y: 0 }
          : isMobile
            ? { x: 0, y: 15 }
            : { x: -20, y: 10 }
      }
      exit={{
        x: "-70vw",
        transition: { duration: 0.55, ease: [0.5, 0, 0.75, 0] },
      }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "clamp(140px, 16vw, 220px)",
      }}
      className="px-4 md:px-12 lg:px-20 mx-auto max-w-[1400px]"
    >
      {/* Glass box */}
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

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* School */}
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "clamp(1.375rem, 2.2vw, 1.875rem)",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            <FuzzyText>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: themed(isDark, cs.iridescent.dark, cs.iridescent.light),
                }}
              >
                {school}
              </span>
            </FuzzyText>
          </h2>

          {/* Degree */}
          <h3
            className="font-[family-name:var(--font-elevated)]"
            style={{
              marginTop: 0,
              marginBottom: "4px",
              fontSize: "clamp(1.0625rem, 1.6vw, 1.375rem)",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "-0.01em",
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
                {degree}
              </span>
            </FuzzyText>
          </h3>

          {/* Timeline */}
          <h4
            className="font-[family-name:var(--font-elevated)]"
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "clamp(0.9375rem, 1.4vw, 1.25rem)",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "-0.01em",
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
                {timeline}
              </span>
            </FuzzyText>
          </h4>

          {/* Divider */}
          <div
            className="bg-black/[0.08] dark:bg-white/[0.1]"
            style={{ height: 1, margin: "8px 0 16px" }}
          />

          {/* GPA */}
          {gpa && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <FuzzyText>
                <span
                  className="text-black/50 dark:text-white/50"
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  GPA
                </span>
              </FuzzyText>
              <div style={{ marginTop: 4 }}>
                <FuzzyText>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: themed(isDark, cs.iridescentShort.dark, cs.iridescentShort.light),
                      fontSize: "clamp(1.25rem, 2vw, 1.75rem)",
                      fontWeight: 700,
                    }}
                  >
                    {gpa}
                  </span>
                </FuzzyText>
              </div>
            </div>
          )}

          {/* Coursework */}
          {coursework && coursework.length > 0 && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <FuzzyText>
                <span
                  className="text-black/50 dark:text-white/50"
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Relevant Coursework
                </span>
              </FuzzyText>
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
                      fontFamily: "monospace",
                      padding: "3px 8px",
                      borderRadius: 8,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {course}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {extras && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <FuzzyText>
                <span
                  className="font-[family-name:var(--font-elevated)] bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: themed(isDark, cs.bodyShort.dark, cs.bodyShort.light),
                    fontSize: "clamp(0.85rem, 1.1vw, 1rem)",
                    fontWeight: 600,
                  }}
                >
                  {extras}
                </span>
              </FuzzyText>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
