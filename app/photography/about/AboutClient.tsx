"use client";

import { useRef, useState } from "react";
import FadeImage from "@/components/photo/FadeImage";
import { motion } from "framer-motion";
import { useIsDark } from "@/lib/glass";
import { EASE_OUT, photoTheme } from "@/components/photo/utils";

// ─── Gear data: update with your actual kit ─────────────────────────────────

type GearItem = { name: string; spec: string; note: string };
type GearCategory = { title: string; items: GearItem[] };

const GEAR: GearCategory[] = [
  {
    title: "Cameras",
    items: [
      { name: "Sony A7 IV", spec: "Full Frame · 33MP", note: "Primary body" },
      { name: "Olympus OM-1", spec: "35mm Film", note: "Film" },
    ],
  },
  {
    title: "Lenses",
    items: [
      { name: "Sigma 24-70mm f/2.8 Art", spec: "Standard Zoom", note: "Everyday carry" },
      { name: "Sigma 70-200mm f/2.8", spec: "Telephoto Zoom", note: "Reach" },
    ],
  },
  {
    title: "Accessories",
    items: [{ name: "PGYTech Sling", spec: "Small · Camera Bag", note: "Daily carry" }],
  },
];

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
};

export default function AboutClient() {
  const isDark = useIsDark();
  const t = photoTheme(isDark);

  // ── Email form state ──
  const [emailForm, setEmailForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const emailFormOpenedAt = useRef(Date.now());
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!emailForm.name.trim()) errs.name = "Name is required";
    if (!emailForm.email.trim()) errs.email = "Email is required";
    else if (!validateEmail(emailForm.email)) errs.email = "Enter a valid email";
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
        body: JSON.stringify({ ...emailForm, website: honeypot, formOpenedAt: emailFormOpenedAt.current }),
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

  const updateField = (field: keyof typeof emailForm, value: string) => {
    setEmailForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field])
      setFieldErrors((fe) => {
        const n = { ...fe };
        delete n[field];
        return n;
      });
  };

  const errorColor = isDark ? "rgb(255,150,150)" : "rgb(185,50,55)";
  const fieldStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "13px 14px",
    // 16px keeps iOS Safari from zooming into the field on focus
    fontSize: 16,
    fontFamily: "inherit",
    background: isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.7)",
    border: `1px solid ${fieldErrors[field] ? errorColor : focused === field ? t.accent : t.rule}`,
    borderRadius: 10,
    color: t.ink,
    outline: "none",
    boxShadow: focused === field ? `0 0 0 4px ${t.accentSoft}` : "none",
    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
  });

  const section: React.CSSProperties = {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "0 clamp(18px, 5vw, 72px)",
  };
  const eyebrow = (label: string) => (
    <div style={{ ...mono, fontSize: 9.5, color: t.sub, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 28, height: 1, background: t.rule }} />
      {label}
    </div>
  );

  return (
    <div style={{ paddingTop: "clamp(28px, 6vw, 64px)", paddingBottom: "clamp(80px, 12vh, 140px)" }}>
      {/* ── Profile ───────────────────────────────────────────────────────── */}
      <section
        style={{
          ...section,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "clamp(36px, 6vw, 88px)",
          alignItems: "center",
        }}
      >
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT }}
          style={{ margin: 0, justifySelf: "center", width: "min(100%, 420px)", position: "relative", padding: 14 }}
        >
          {/* Viewfinder brackets around the portrait */}
          {[
            { left: 0, top: 0, rot: 0 },
            { right: 0, top: 0, rot: 90 },
            { right: 0, bottom: 0, rot: 180 },
            { left: 0, bottom: 0, rot: 270 },
          ].map(({ rot, ...pos }) => (
            <span
              key={rot}
              aria-hidden
              style={{
                position: "absolute",
                width: 22,
                height: 22,
                borderTop: `1.5px solid ${t.ink}`,
                borderLeft: `1.5px solid ${t.ink}`,
                transform: `rotate(${rot}deg)`,
                opacity: 0.6,
                ...pos,
              }}
            />
          ))}
          <div
            style={{
              position: "relative",
              aspectRatio: "3 / 4",
              overflow: "hidden",
              borderRadius: 3,
              background: isDark ? "#1a1620" : "#e6e0da",
            }}
          >
            <div style={{ position: "absolute", inset: 0 }}>
              <FadeImage
                src="/photography/photo_profile/IMG_8692.jpeg"
                alt="Henry Kanaskie"
                fill
                priority
                sizes="(min-width: 768px) 420px, 90vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          <figcaption style={{ ...mono, fontSize: 8.5, color: t.faint, display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <span style={{ color: "rgb(90, 200, 130)" }}>● AF-C</span>
            <span>Salem, Oregon</span>
          </figcaption>
        </motion.figure>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: EASE_OUT }}
          style={{ display: "flex", flexDirection: "column", gap: 22 }}
        >
          <div style={{ ...mono, fontSize: 10, color: t.sub }}>Henry Kanaskie</div>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-elevated)",
              fontWeight: 300,
              fontSize: "clamp(3rem, 8vw, 6.4rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: t.ink,
            }}
          >
            Photographer
          </h1>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: "60ch",
              fontSize: "clamp(0.98rem, 1.25vw, 1.08rem)",
              lineHeight: 1.75,
              color: t.sub,
            }}
          >
            <p style={{ margin: 0 }}>
              Based in Salem, Oregon, I picked up a camera to document my travels and adventures and never really put it back down. Street
              photography and landscapes pull me in equal measure, but astrophotography is the one that still genuinely amazes me every
              time. Beyond all of that, I love capturing people as they are, happy, candid, unguarded. For me, a photograph is just a way of
              holding onto how something felt.
            </p>
            <p style={{ margin: 0 }}>
              I shoot with a light touch on post-processing but put a lot of thought into composition and framing. The dreamy, textured look
              of film is a big influence on how I see things. More than anything, I want a photo to carry the feeling I had when I took it.
              If it does that, it is a good photo.
            </p>
          </div>
          <div style={{ ...mono, fontSize: 9, color: t.ink, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Digital", "Film", "Available for commissions"].map((tag) => (
              <span key={tag} style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${t.rule}` }}>
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── In the bag ────────────────────────────────────────────────────── */}
      <section style={{ ...section, marginTop: "clamp(96px, 16vh, 180px)", display: "flex", flexDirection: "column", gap: 28 }}>
        {eyebrow("In the bag")}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "clamp(28px, 4vw, 56px)" }}
        >
          {GEAR.map((cat) => (
            <div key={cat.title}>
              <h3 style={{ ...mono, fontSize: 9, color: t.faint, margin: "0 0 6px", fontWeight: 400 }}>{cat.title}</h3>
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "16px 0",
                    borderBottom: `1px solid ${t.rule}`,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-elevated)", fontSize: "1.15rem", color: t.ink }}>{item.name}</span>
                  <span style={{ ...mono, letterSpacing: "0.14em", fontSize: 9, color: t.sub }}>
                    {item.spec} · {item.note}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section
        id="contact"
        style={{
          ...section,
          marginTop: "clamp(96px, 16vh, 180px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "clamp(36px, 6vw, 88px)",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {eyebrow("Contact")}
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-elevated)",
              fontWeight: 300,
              fontSize: "clamp(2.4rem, 6vw, 4.6rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              color: t.ink,
            }}
          >
            Get in touch
          </h2>
          <p style={{ margin: 0, color: t.sub, fontSize: "clamp(0.98rem, 1.25vw, 1.08rem)", lineHeight: 1.7, maxWidth: "42ch" }}>
            Available for commissions, collaborations, and print inquiries. Send me a message and I&apos;ll get back to you.
          </p>
          <a
            href="https://instagram.com/henrykanaskie"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...mono,
              alignSelf: "flex-start",
              fontSize: 9.5,
              color: t.ink,
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: 999,
              border: `1px solid ${t.rule}`,
            }}
          >
            Instagram ↗
          </a>
        </div>

        <form onSubmit={handleEmailSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
          {/* Honeypot: visually hidden, bots fill it, humans never see it */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
            {(["name", "email"] as const).map((field) => (
              <label key={field} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ ...mono, fontSize: 8.5, color: t.sub }}>{field}</span>
                <input
                  id={`contact-${field}`}
                  type={field === "email" ? "email" : "text"}
                  autoComplete={field === "email" ? "email" : "name"}
                  value={emailForm[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  onFocus={() => setFocused(field)}
                  onBlur={() => setFocused(null)}
                  style={fieldStyle(field)}
                />
                {fieldErrors[field] && <span style={{ fontSize: 12, color: errorColor }}>{fieldErrors[field]}</span>}
              </label>
            ))}
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ ...mono, fontSize: 8.5, color: t.sub }}>Subject</span>
            <input
              id="contact-subject"
              type="text"
              value={emailForm.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              onFocus={() => setFocused("subject")}
              onBlur={() => setFocused(null)}
              style={fieldStyle("subject")}
            />
            {fieldErrors.subject && <span style={{ fontSize: 12, color: errorColor }}>{fieldErrors.subject}</span>}
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ ...mono, fontSize: 8.5, color: t.sub }}>Message</span>
            <textarea
              id="contact-message"
              rows={6}
              value={emailForm.message}
              onChange={(e) => updateField("message", e.target.value)}
              onFocus={() => setFocused("message")}
              onBlur={() => setFocused(null)}
              style={{ ...fieldStyle("message"), resize: "vertical", minHeight: 140 }}
            />
            {fieldErrors.message && <span style={{ fontSize: 12, color: errorColor }}>{fieldErrors.message}</span>}
          </label>

          {emailStatus === "error" && <p style={{ margin: 0, fontSize: 14, color: errorColor }}>{emailError}</p>}

          {emailStatus === "sent" ? (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 15, color: isDark ? "rgb(150, 215, 175)" : "rgb(40, 125, 80)" }}>
                Message sent. I&apos;ll reply soon.
              </p>
              <button
                type="button"
                onClick={() => setEmailStatus("idle")}
                style={{
                  ...mono,
                  fontSize: 9,
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: `1px solid ${t.rule}`,
                  background: "transparent",
                  color: t.ink,
                  cursor: "pointer",
                }}
              >
                Send another
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={emailStatus === "sending"}
              style={{
                ...mono,
                alignSelf: "flex-start",
                fontSize: 10,
                padding: "15px 26px",
                borderRadius: 999,
                border: "none",
                background: t.ink,
                color: t.bg,
                cursor: emailStatus === "sending" ? "wait" : "pointer",
                opacity: emailStatus === "sending" ? 0.6 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              {emailStatus === "sending" ? "Sending..." : "Send message →"}
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
