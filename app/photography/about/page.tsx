"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useIsDark } from "@/components/InfoBubble";

// ─── Gear data — update with your actual kit ─────────────────────────────────

type GearItem = { name: string; spec: string; note: string };
type GearCategory = { num: string; title: string; items: GearItem[] };

const GEAR: GearCategory[] = [
  {
    num: "01",
    title: "Cameras",
    items: [
      { name: "Sony A7 IV", spec: "Full Frame · 33MP", note: "Primary body" },
      { name: "Fujifilm X100V", spec: "APS-C · 26MP", note: "Street & travel" },
    ],
  },
  {
    num: "02",
    title: "Lenses",
    items: [
      {
        name: "Sony FE 35mm f/1.8",
        spec: "Prime · Wide",
        note: "Everyday carry",
      },
      {
        name: "Sony FE 85mm f/1.8",
        spec: "Prime · Portrait",
        note: "Portraits",
      },
      {
        name: "Sony FE 16-35mm f/2.8 GM",
        spec: "Wide Zoom",
        note: "Landscape",
      },
      {
        name: "Sony FE 70-200mm f/4 G",
        spec: "Telephoto Zoom",
        note: "Astrophotography",
      },
    ],
  },
  {
    num: "03",
    title: "Accessories",
    items: [
      {
        name: "Gitzo Traveler GT1545T",
        spec: "Carbon Tripod",
        note: "Landscape & Astro",
      },
      {
        name: "Peak Design Everyday 20L",
        spec: "Camera Backpack",
        note: "Daily carry",
      },
      { name: "B+W 77mm CPL", spec: "Circular Polarizer", note: "Landscape" },
      { name: "Godox V1 Pro", spec: "Round Head Flash", note: "Portraits" },
    ],
  },
];

// ─── Gear category ────────────────────────────────────────────────────────────

function GearCategory({
  category,
  isDark,
}: {
  category: GearCategory;
  isDark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });

  const titleColor = isDark ? "rgba(238,232,224,0.90)" : "rgba(28,22,16,0.88)";
  const numColor = isDark ? "rgb(185, 165, 210)" : "rgb(120, 95, 135)";
  const ruleColor = isDark ? "rgba(195,175,225,0.12)" : "rgba(128,72,138,0.15)";
  const nameColor = isDark ? "rgba(238,232,224,0.80)" : "rgba(28,22,16,0.80)";
  const specColor = isDark ? "rgba(238,232,224,0.32)" : "rgba(28,22,16,0.36)";
  const noteColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const rowDivider = isDark
    ? "rgba(195,175,225,0.04)"
    : "rgba(128,72,138,0.05)";

  return (
    <div ref={ref}>
      {/* Category header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <span
          style={{
            color: numColor,
            fontSize: "10px",
            letterSpacing: "0.3em",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          {category.num}
        </span>
        <div
          style={{
            width: 28,
            height: "0.5px",
            background: ruleColor,
            alignSelf: "center",
            flexShrink: 0,
          }}
        />
        <h3
          style={{
            fontSize: "clamp(0.95rem, 1.8vw, 1.25rem)",
            fontWeight: 300,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: titleColor,
            margin: 0,
          }}
        >
          {category.title}
        </h3>
      </motion.div>

      {/* Gear rows */}
      {category.items.map((item, i) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.45,
            delay: 0.08 + i * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            padding: "11px 0",
            borderBottom: `0.5px solid ${rowDivider}`,
          }}
        >
          <span
            style={{
              fontSize: "13.5px",
              color: nameColor,
              fontWeight: 400,
              minWidth: 0,
            }}
          >
            {item.name}
          </span>
          <span
            style={{
              fontSize: "10.5px",
              color: specColor,
              letterSpacing: "0.04em",
              flexShrink: 0,
              whiteSpace: "nowrap",
              padding: "0 6px",
            }}
          >
            {item.spec}
          </span>
          <span
            style={{
              color: noteColor,
              fontSize: "8.5px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              flexShrink: 0,
              whiteSpace: "nowrap",
              textAlign: "right",
            }}
          >
            {item.note}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhotographyAboutPage() {
  const isDark = useIsDark();

  // ── Email form state ──
  const [emailForm, setEmailForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [emailError, setEmailError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!emailForm.name.trim()) errs.name = "Name is required";
    if (!emailForm.email.trim()) errs.email = "Email is required";
    else if (!validateEmail(emailForm.email))
      errs.email = "Enter a valid email";
    if (!emailForm.subject.trim()) errs.subject = "Subject is required";
    if (!emailForm.message.trim()) errs.message = "Message is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
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

  const titleColor = isDark ? "rgb(218, 198, 228)" : "rgb(100, 80, 115)";
  const subColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const mutedColor = isDark ? "rgb(185, 165, 210)" : "rgb(120, 95, 135)";
  const ruleColor = isDark ? "rgba(195,175,225,0.12)" : "rgba(128,72,138,0.15)";
  const bodyColor = isDark ? "rgba(238,232,224,0.52)" : "rgba(28,22,16,0.58)";


  return (
    <>
      {/* Page content */}
      <div
        style={{
          position: "relative",
          padding: "clamp(64px, 8vw, 100px) clamp(20px, 5vw, 72px)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* ── Profile section ─────────────────────────────────────────────────── */}
        <div
          className="flex flex-col md:flex-row gap-10 md:gap-16 items-start"
          style={{ marginBottom: "clamp(64px, 8vw, 96px)" }}
        >
          {/* Portrait photo placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexShrink: 0, width: "clamp(150px, 26vw, 260px)" }}
          >
            <div
              style={{
                aspectRatio: "2/3",
                borderRadius: 2,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
                boxShadow: isDark
                  ? "0 4px 24px rgba(0,0,0,0.5)"
                  : "0 2px 12px rgba(0,0,0,0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src="/photography/photo_profile/IMG_8692.jpeg"
                alt="Henry Kanaskie"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center"
            style={{ gap: 18, paddingTop: "clamp(0px, 2vw, 32px)" }}
          >
            <p
              style={{
                color: subColor,
                fontSize: "9px",
                letterSpacing: "0.48em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Henry Kanaskie
            </p>

            <h1
              style={{
                color: titleColor,
                fontSize: "clamp(2rem, 5vw, 4rem)",
                fontWeight: 300,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              Photographer
            </h1>

            <div
              style={{ width: 48, height: "0.5px", background: ruleColor }}
            />

            {/* ── Replace the paragraphs below with your own bio ── */}
            <p
              style={{
                fontSize: "clamp(0.875rem, 1.4vw, 0.975rem)",
                color: bodyColor,
                lineHeight: 1.8,
                margin: 0,
                maxWidth: 480,
                fontWeight: 400,
              }}
            >
              Replace this with a short intro about yourself — where you are
              based, what draws you to photography, and the stories you want to
              tell through your images.
            </p>
            <p
              style={{
                fontSize: "clamp(0.875rem, 1.4vw, 0.975rem)",
                color: bodyColor,
                lineHeight: 1.8,
                margin: 0,
                maxWidth: 480,
                fontWeight: 400,
              }}
            >
              A second paragraph about your style, influences, or the subjects
              and moments that inspire you most. Keep it personal.
            </p>
            {/* ── End bio ── */}

            <p
              style={{
                color: mutedColor,
                fontSize: "8.5px",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              35mm · Digital · Available for commissions
            </p>
          </motion.div>
        </div>

        {/* Section divider */}
        <div
          style={{
            height: "0.5px",
            background: ruleColor,
            marginBottom: "clamp(48px, 6vw, 72px)",
          }}
        />

        {/* ── Gear section ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "clamp(32px, 4vw, 48px)" }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 36, height: "0.5px", background: ruleColor, margin: "0 auto 16px" }} />
            <h2
              style={{
                color: titleColor,
                fontSize: "clamp(2rem, 4.5vw, 3.8rem)",
                fontWeight: 300,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              What I Shoot With
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-14">
          {GEAR.map((category) => (
            <GearCategory
              key={category.title}
              category={category}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Section divider */}
        <div
          style={{
            height: "0.5px",
            background: ruleColor,
            margin: "clamp(48px, 6vw, 72px) 0",
          }}
        />

        {/* ── Contact / Get in Touch ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "clamp(32px, 4vw, 48px)" }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 36, height: "0.5px", background: ruleColor, margin: "0 auto 16px" }} />
            <h2
              style={{
                color: titleColor,
                fontSize: "clamp(2rem, 4.5vw, 3.8rem)",
                fontWeight: 300,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              Get in Touch
            </h2>
          </div>
          <p
            style={{
              color: bodyColor,
              fontSize: "clamp(0.82rem, 1.2vw, 0.95rem)",
              lineHeight: 1.7,
              marginTop: 16,
              maxWidth: 520,
            }}
          >
            Available for commissions, collaborations, and print inquiries. Send
            me a message and I&apos;ll get back to you.
          </p>
        </motion.div>

        {/* Contact links */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 24px",
            marginBottom: "clamp(32px, 4vw, 48px)",
          }}
        >
          {[
            { label: "Instagram", href: "https://instagram.com/henrykanaskie" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: "8.5px",
                letterSpacing: "0.38em",
                textTransform: "uppercase" as const,
                color: subColor,
                textDecoration: "none",
                padding: "8px 16px",
                border: `0.5px solid ${ruleColor}`,
                borderRadius: 1,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  isDark ? "rgba(200,170,255,0.35)" : "rgba(130,65,145,0.38)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  ruleColor;
              }}
            >
              {item.label}
            </a>
          ))}
        </motion.div>

        {/* Email form */}
        <motion.form
          onSubmit={handleEmailSubmit}
          noValidate
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{
            maxWidth: 560,
            display: "flex",
            flexDirection: "column" as const,
            gap: 16,
          }}
        >
          {(["name", "email", "subject"] as const).map((field) => (
            <div key={field}>
              <label
                style={{
                  color: mutedColor,
                  display: "block",
                  marginBottom: 6,
                  fontSize: "8px",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase" as const,
                  fontFamily: "monospace",
                }}
              >
                {field}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                value={emailForm[field]}
                onChange={(e) => {
                  setEmailForm((f) => ({ ...f, [field]: e.target.value }));
                  if (fieldErrors[field])
                    setFieldErrors((fe) => {
                      const n = { ...fe };
                      delete n[field];
                      return n;
                    });
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "0.88rem",
                  background: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.025)",
                  border: `0.5px solid ${fieldErrors[field] ? (isDark ? "rgba(255,120,120,0.5)" : "rgba(200,60,60,0.4)") : ruleColor}`,
                  borderRadius: 2,
                  color: isDark
                    ? "rgba(238,232,224,0.8)"
                    : "rgba(28,22,16,0.75)",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? "rgba(200,170,255,0.35)"
                    : "rgba(130,65,145,0.38)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = fieldErrors[field]
                    ? isDark
                      ? "rgba(255,120,120,0.5)"
                      : "rgba(200,60,60,0.4)"
                    : ruleColor;
                }}
              />
              {fieldErrors[field] && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "7.5px",
                    letterSpacing: "0.3em",
                    fontFamily: "monospace",
                    textTransform: "uppercase" as const,
                    color: isDark
                      ? "rgba(255,140,140,0.7)"
                      : "rgba(180,50,50,0.6)",
                  }}
                >
                  {fieldErrors[field]}
                </p>
              )}
            </div>
          ))}
          <div>
            <label
              style={{
                color: mutedColor,
                display: "block",
                marginBottom: 6,
                fontSize: "8px",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
                fontFamily: "monospace",
              }}
            >
              Message
            </label>
            <textarea
              rows={5}
              value={emailForm.message}
              onChange={(e) => {
                setEmailForm((f) => ({ ...f, message: e.target.value }));
                if (fieldErrors.message)
                  setFieldErrors((fe) => {
                    const n = { ...fe };
                    delete n.message;
                    return n;
                  });
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "0.88rem",
                background: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.025)",
                border: `0.5px solid ${fieldErrors.message ? (isDark ? "rgba(255,120,120,0.5)" : "rgba(200,60,60,0.4)") : ruleColor}`,
                borderRadius: 2,
                color: isDark ? "rgba(238,232,224,0.8)" : "rgba(28,22,16,0.75)",
                outline: "none",
                resize: "none" as const,
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = isDark
                  ? "rgba(200,170,255,0.35)"
                  : "rgba(130,65,145,0.38)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = fieldErrors.message
                  ? isDark
                    ? "rgba(255,120,120,0.5)"
                    : "rgba(200,60,60,0.4)"
                  : ruleColor;
              }}
            />
            {fieldErrors.message && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "7.5px",
                  letterSpacing: "0.3em",
                  fontFamily: "monospace",
                  textTransform: "uppercase" as const,
                  color: isDark
                    ? "rgba(255,140,140,0.7)"
                    : "rgba(180,50,50,0.6)",
                }}
              >
                {fieldErrors.message}
              </p>
            )}
          </div>

          {emailStatus === "error" && (
            <p
              style={{
                color: "rgba(255,120,120,0.85)",
                fontSize: "0.82rem",
                margin: 0,
              }}
            >
              {emailError}
            </p>
          )}

          {emailStatus === "sent" ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: 12,
              }}
            >
              <p
                style={{
                  color: isDark ? "rgb(160, 210, 180)" : "rgb(70, 135, 95)",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  margin: 0,
                }}
              >
                Message sent successfully.
              </p>
              <button
                type="button"
                onClick={() => setEmailStatus("idle")}
                style={{
                  padding: "10px 24px",
                  fontSize: "8.5px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase" as const,
                  fontFamily: "monospace",
                  backgroundColor: "transparent",
                  border: `0.5px solid ${ruleColor}`,
                  borderRadius: 1,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  alignSelf: "flex-start",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    isDark ? "rgba(200,170,255,0.35)" : "rgba(130,65,145,0.38)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    ruleColor;
                }}
              >
                <span style={{ color: subColor }}>Send Another →</span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={emailStatus === "sending"}
              style={{
                marginTop: 4,
                padding: "10px 24px",
                fontSize: "8.5px",
                letterSpacing: "0.38em",
                textTransform: "uppercase" as const,
                fontFamily: "monospace",
                backgroundColor: "transparent",
                border: `0.5px solid ${ruleColor}`,
                borderRadius: 1,
                cursor: emailStatus === "sending" ? "not-allowed" : "pointer",
                opacity: emailStatus === "sending" ? 0.5 : 1,
                transition: "all 0.3s ease",
                alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => {
                if (emailStatus !== "sending") {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    isDark ? "rgba(200,170,255,0.35)" : "rgba(130,65,145,0.38)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  ruleColor;
              }}
            >
              <span style={{ color: subColor }}>
                {emailStatus === "sending" ? "Sending..." : "Send Message →"}
              </span>
            </button>
          )}
        </motion.form>

        <div style={{ height: 80 }} />
      </div>
    </>
  );
}
