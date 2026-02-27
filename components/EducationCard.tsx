"use client";

import { glassClassNames, FuzzyText } from "./LeftInfoBox";
import { glassStyle, useIsDark } from "./InfoBubble";

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

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "clamp(140px, 16vw, 220px)",
      }}
      className="px-4 md:px-12 lg:px-20 mx-auto max-w-[1400px]"
    >
      {/* Glass box */}
      <div
        style={{
          position: "relative",
          borderRadius: "24px",
          ...glassStyle,
        }}
        className={`${glassClassNames} p-5 md:p-10 lg:p-12`}
      >
        {/* Specular highlight — top */}
        <div
          className="dark:hidden"
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)",
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          className="hidden dark:block"
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Bottom specular highlight */}
        <div
          className="dark:hidden"
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)",
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          className="hidden dark:block"
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)",
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Chromatic aberration edge glow */}
        <div
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 0,
            boxShadow:
              "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)",
          }}
        />

        {/* Internal refraction gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
          }}
        />

        {/* Edge distortion */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 0,
            WebkitMaskImage:
              "radial-gradient(ellipse at center, transparent 55%, black 100%)",
            maskImage:
              "radial-gradient(ellipse at center, transparent 55%, black 100%)",
            backdropFilter: "blur(3px) saturate(1.1)",
            WebkitBackdropFilter: "blur(3px) saturate(1.1)",
          }}
        />

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
                  backgroundImage: isDark
                    ? `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`
                    : `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`,
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
                  backgroundImage: isDark
                    ? `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 15%, rgba(248,252,255,0.95) 30%, rgba(255,250,255,0.92) 45%, rgba(245,250,255,0.94) 60%, rgba(255,248,255,0.93) 75%, rgba(248,250,255,0.95) 90%, rgba(255,248,255,0.93) 100%)`
                    : `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 15%, rgba(10,20,30,0.94) 30%, rgba(30,15,25,0.9) 45%, rgba(10,20,28,0.93) 60%, rgba(22,12,32,0.91) 75%, rgba(12,18,30,0.94) 90%, rgba(28,15,28,0.91) 100%)`,
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
                  backgroundImage: isDark
                    ? `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 15%, rgba(248,252,255,0.95) 30%, rgba(255,250,255,0.92) 45%, rgba(245,250,255,0.94) 60%, rgba(255,248,255,0.93) 75%, rgba(248,250,255,0.95) 90%, rgba(255,248,255,0.93) 100%)`
                    : `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 15%, rgba(10,20,30,0.94) 30%, rgba(30,15,25,0.9) 45%, rgba(10,20,28,0.93) 60%, rgba(22,12,32,0.91) 75%, rgba(12,18,30,0.94) 90%, rgba(28,15,28,0.91) 100%)`,
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
                      backgroundImage: isDark
                        ? "linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))"
                        : "linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))",
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
                    backgroundImage: isDark
                      ? `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 50%, rgba(248,250,255,0.95) 100%)`
                      : `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 50%, rgba(12,18,30,0.94) 100%)`,
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
      </div>
    </div>
  );
}
