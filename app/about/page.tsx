"use client";

import { useState } from "react";
import GlassTitle from "@/components/GlassTitle";
import SkillBar from "@/components/SkillBar";
import { glassClassNames, FuzzyText } from "@/components/LeftInfoBox";
import { glassStyle, useIsDark } from "@/components/InfoBubble";

function GlassBlurb({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const isDark = useIsDark();
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
      className="px-2 md:px-4 w-full h-full"
    >
      <div
        style={{
          position: "relative",
          borderRadius: "24px",
          ...glassStyle,
        }}
        className={`${glassClassNames} p-5 md:p-10 lg:p-12 h-full`}
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
          {title && (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: isDark
                      ? `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`
                      : `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`,
                    fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                    fontWeight: 700,
                  }}
                >
                  {title}
                </span>
              </FuzzyText>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const isDark = useIsDark();
  const [resumeOpen, setResumeOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus("sending");
    setEmailError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailStatus("error");
        setEmailError(data.error || "Failed to send.");
        return;
      }
      setEmailStatus("sent");
      setEmailForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setEmailStatus("error");
      setEmailError("Something went wrong.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 md:gap-28 pb-[10vh]">
      <GlassTitle text="Henry Kanaskie" />

      {/* Contact info */}
      <div
        className="-mt-4 md:-mt-20 flex flex-wrap items-center justify-center gap-y-3"
        style={{
          fontSize: "clamp(1.1rem, 2vw, 1.6rem)",
          fontWeight: 600,
        }}
      >
        {[
          {
            label: "Email",
            href: undefined,
            action: () => { setEmailOpen(true); setEmailStatus("idle"); },
          },
          {
            label: "LinkedIn",
            href: "https://linkedin.com/in/henry-kanaskie",
            action: undefined,
          },
          {
            label: "Resume",
            href: undefined,
            action: () => setResumeOpen(true),
          },
        ].map((item, i, arr) => {
          const inner = (
            <span
              className="bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: "text",
                backgroundImage: isDark
                  ? `linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))`
                  : `linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))`,
              }}
            >
              {item.label}
            </span>
          );
          const separator = i < arr.length - 1 && (
            <span
              className="mx-5 inline-block"
              style={{
                width: "1px",
                height: "1em",
                background: isDark
                  ? "linear-gradient(180deg, transparent, rgba(180,200,255,0.3), transparent)"
                  : "linear-gradient(180deg, transparent, rgba(100,115,145,0.25), transparent)",
              }}
            />
          );
          return (
            <span key={item.label} className="flex items-center">
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  {inner}
                </a>
              ) : item.action ? (
                <button
                  onClick={item.action}
                  className="hover:opacity-70 transition-opacity cursor-pointer"
                >
                  {inner}
                </button>
              ) : (
                inner
              )}
              {separator}
            </span>
          );
        })}
      </div>

      {/* About blurb + photo side by side */}
      <div className="flex flex-col md:flex-row md:items-stretch gap-8 md:gap-16 max-w-8xl w-full px-2 md:px-4 md:min-h-[380px]">
        <div className="flex-1 flex">
          <GlassBlurb>
            <FuzzyText>
              <p
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: isDark
                    ? `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`
                    : `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`,
                  fontSize: "clamp(0.95rem, 1.4vw, 1.15rem)",
                  fontWeight: 500,
                  lineHeight: 1.8,
                }}
              >
                I&apos;m a Computer Science honors student at Oregon State
                University with a 3.95 GPA, passionate about embedded systems,
                signal processing, and machine learning. From optimizing
                anti-drone software at DZYNE Technologies to engineering
                plasma thruster diagnostics and FPGA-based DSP pipelines in
                research labs, I love working at the intersection of hardware
                and software. I&apos;m driven by problems where physics meets
                computation.
              </p>
            </FuzzyText>
          </GlassBlurb>
        </div>
        <div className="flex-[0.65] flex">
          <GlassBlurb>
            <div className="flex items-center justify-center h-full">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: isDark
                    ? `linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))`
                    : `linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))`,
                  fontSize: "clamp(0.8rem, 1.2vw, 1rem)",
                  fontWeight: 500,
                }}
              >
                Your photo here
              </span>
            </div>
          </GlassBlurb>
        </div>
      </div>

      {/* Resume modal */}
      {resumeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setResumeOpen(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          {/* Modal content */}
          <div
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl ${glassClassNames}`}
            style={{
              ...glassStyle,
              backgroundColor: isDark
                ? "rgba(20,20,40,0.65)"
                : "rgba(255,255,255,0.55)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Specular highlight — top */}
            <div
              className="dark:hidden"
              style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            <div
              className="hidden dark:block"
              style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            {/* Bottom specular highlight */}
            <div
              className="dark:hidden"
              style={{
                position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            <div
              className="hidden dark:block"
              style={{
                position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            {/* Chromatic aberration edge glow */}
            <div
              style={{
                position: "absolute", top: -1, left: -1, right: -1, bottom: -1,
                borderRadius: "inherit", pointerEvents: "none", zIndex: 0,
                boxShadow: "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)",
              }}
            />
            {/* Internal refraction gradient */}
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: "inherit", pointerEvents: "none", zIndex: 0,
                background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
              }}
            />
            {/* Edge distortion */}
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: "inherit", pointerEvents: "none", zIndex: 0,
                WebkitMaskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)",
                maskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)",
                backdropFilter: "blur(3px) saturate(1.1)",
                WebkitBackdropFilter: "blur(3px) saturate(1.1)",
              }}
            />

            {/* Close + Download buttons */}
            <div className="sticky top-0 z-10 flex justify-between items-center p-4">
              <a
                href="/Kanaskie_Henry_Resume.pdf"
                download
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-opacity hover:opacity-70 ${glassClassNames}`}
                style={{
                  ...glassStyle,
                  backgroundColor: isDark
                    ? "rgba(180,200,255,0.08)"
                    : "rgba(100,115,145,0.06)",
                }}
              >
                <span
                  className="flex items-center gap-2 bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: isDark
                      ? "linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))"
                      : "linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isDark ? "rgb(180,200,255)" : "rgb(100,115,145)"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </span>
              </a>
              <button
                onClick={() => setResumeOpen(false)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 cursor-pointer ${glassClassNames}`}
                style={{
                  ...glassStyle,
                  backgroundColor: isDark
                    ? "rgba(180,200,255,0.08)"
                    : "rgba(100,115,145,0.06)",
                  color: isDark ? "rgb(180,200,255)" : "rgb(100,115,145)",
                }}
              >
                ✕
              </button>
            </div>
            {/* Resume PDF */}
            <div className="p-6 pt-0 relative z-[1]">
              <div
                className="w-full rounded-lg"
                style={{
                  height: "80vh",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <iframe
                  src="/Kanaskie_Henry_Resume.pdf#toolbar=0&navpanes=0"
                  style={{
                    border: "none",
                    outline: "none",
                    position: "absolute",
                    top: "-4px",
                    left: "-4px",
                    width: "calc(100% + 8px)",
                    height: "calc(100% + 8px)",
                    colorScheme: "light",
                  }}
                  title="Resume"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email modal */}
      {emailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setEmailOpen(false)}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          <div
            className={`relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-3xl ${glassClassNames}`}
            style={{
              ...glassStyle,
              backgroundColor: isDark
                ? "rgba(20,20,40,0.65)"
                : "rgba(255,255,255,0.55)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Specular highlight — top */}
            <div
              className="dark:hidden"
              style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            <div
              className="hidden dark:block"
              style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            {/* Bottom specular highlight */}
            <div
              className="dark:hidden"
              style={{
                position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            <div
              className="hidden dark:block"
              style={{
                position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)",
                borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
              }}
            />
            {/* Chromatic aberration edge glow */}
            <div
              style={{
                position: "absolute", top: -1, left: -1, right: -1, bottom: -1,
                borderRadius: "inherit", pointerEvents: "none", zIndex: 0,
                boxShadow: "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)",
              }}
            />
            {/* Internal refraction gradient */}
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: "inherit", pointerEvents: "none", zIndex: 0,
                background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
              }}
            />
            {/* Edge distortion */}
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: "inherit", pointerEvents: "none", zIndex: 0,
                WebkitMaskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)",
                maskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)",
                backdropFilter: "blur(3px) saturate(1.1)",
                WebkitBackdropFilter: "blur(3px) saturate(1.1)",
              }}
            />

            {/* Header */}
            <div className="relative z-[1] flex justify-between items-center p-6 pb-0">
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: isDark
                      ? `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`
                      : `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`,
                    fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                    fontWeight: 700,
                  }}
                >
                  Send a Message
                </span>
              </FuzzyText>
              <button
                onClick={() => setEmailOpen(false)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 cursor-pointer ${glassClassNames}`}
                style={{
                  ...glassStyle,
                  backgroundColor: isDark
                    ? "rgba(180,200,255,0.08)"
                    : "rgba(100,115,145,0.06)",
                  color: isDark ? "rgb(180,200,255)" : "rgb(100,115,145)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="relative z-[1] p-6 flex flex-col gap-4">
              {(["name", "email", "subject"] as const).map((field) => (
                <div key={field}>
                  <FuzzyText>
                    <label
                      className="block mb-1.5 bg-clip-text text-transparent"
                      style={{
                        WebkitBackgroundClip: "text",
                        backgroundImage: isDark
                          ? "linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))"
                          : "linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {field}
                    </label>
                  </FuzzyText>
                  <input
                    type={field === "email" ? "email" : "text"}
                    required
                    value={emailForm[field]}
                    onChange={(e) =>
                      setEmailForm((f) => ({ ...f, [field]: e.target.value }))
                    }
                    className={`w-full rounded-xl px-4 py-2.5 outline-none transition-colors ${glassClassNames}`}
                    style={{
                      ...glassStyle,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                      color: isDark ? "rgb(200,215,255)" : "rgb(80,95,125)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              ))}
              <div>
                <FuzzyText>
                  <label
                    className="block mb-1.5 bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: isDark
                        ? "linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))"
                        : "linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Message
                  </label>
                </FuzzyText>
                <textarea
                  required
                  rows={5}
                  value={emailForm.message}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, message: e.target.value }))
                  }
                  className={`w-full rounded-xl px-4 py-2.5 outline-none transition-colors resize-none ${glassClassNames}`}
                  style={{
                    ...glassStyle,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                    color: isDark ? "rgb(200,215,255)" : "rgb(80,95,125)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {emailStatus === "error" && (
                <p style={{ color: "rgb(255,120,120)", fontSize: "0.85rem" }}>
                  {emailError}
                </p>
              )}

              {emailStatus === "sent" ? (
                <FuzzyText>
                  <p
                    className="text-center py-2 bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: isDark
                        ? "linear-gradient(135deg, rgb(160,230,190), rgb(180,210,200))"
                        : "linear-gradient(135deg, rgb(60,130,80), rgb(80,140,100))",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                    }}
                  >
                    Message sent successfully!
                  </p>
                </FuzzyText>
              ) : (
                <button
                  type="submit"
                  disabled={emailStatus === "sending"}
                  className={`mt-2 w-full py-3 rounded-xl transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${glassClassNames}`}
                  style={{
                    ...glassStyle,
                    backgroundColor: isDark
                      ? "rgba(180,200,255,0.1)"
                      : "rgba(100,115,145,0.08)",
                  }}
                >
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: isDark
                        ? "linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 50%, rgb(180,210,235) 100%)"
                        : "linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 50%, rgb(105,130,150) 100%)",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                    }}
                  >
                    {emailStatus === "sending" ? "Sending..." : "Send"}
                  </span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Skills side by side */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8 max-w-8xl w-full px-2 md:px-4">
        <div className="flex-1">
          <GlassBlurb title="Languages & Frameworks">
            <SkillBar name="Python" level={92} />
            <SkillBar name="C / C++" level={82} />
            <SkillBar name="JavaScript / React" level={80} />
            <SkillBar name="SQL" level={75} />
            <SkillBar name="MATLAB" level={78} />
            <SkillBar name="VHDL" level={70} />
            <SkillBar name="R" level={50} />
            <SkillBar name="Assembly" level={45} />
          </GlassBlurb>
        </div>
        <div className="flex-1">
          <GlassBlurb title="Tools & Libraries">
            <SkillBar name="Git" level={90} />
            <SkillBar name="PyTorch" level={82} />
            <SkillBar name="NumPy / Pandas" level={88} />
            <SkillBar name="TensorFlow" level={65} />
            <SkillBar name="Scikit-learn" level={75} />
            <SkillBar name="Google Cloud" level={60} />
            <SkillBar name="Linux / Unix" level={80} />
            <SkillBar name="Flask" level={70} />
          </GlassBlurb>
        </div>
      </div>

      <div style={{ height: 100 }} />
    </div>
  );
}
