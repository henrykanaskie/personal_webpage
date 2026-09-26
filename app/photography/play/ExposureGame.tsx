"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useIsDark } from "@/lib/glass";
import type { PhotoEntry } from "../data";
import { EASE_OUT, aspect, cameraName, exposureLine, pad2, photoTheme, rgbTriplet } from "@/components/photo/utils";
import { miss, shutter, success } from "@/components/photo/feedback";
import { ROUNDS, Round, SETTING_LABEL, buildRounds, hint, rank } from "./gameLogic";

export interface GamePhoto {
  photo: PhotoEntry;
  sectionTitle: string;
}

type Phase = "intro" | "playing" | "done";
const BEST_KEY = "exposure-best";

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
};

function readBest(): number | null {
  try {
    const v = localStorage.getItem(BEST_KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

export default function ExposureGame({ photos }: { photos: GamePhoto[] }) {
  const isDark = useIsDark();
  const t = photoTheme(isDark);
  const [phase, setPhase] = useState<Phase>("intro");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [newBest, setNewBest] = useState(false);

  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    setBest(readBest());
    const check = () => setNarrow(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  // On phones the photo shares the screen with the question, so both fit without scrolling
  const frameMax = narrow ? "38svh" : "min(66svh, 720px)";

  const score = results.filter(Boolean).length;
  const round = rounds[at];

  const start = useCallback(() => {
    setRounds(buildRounds(photos));
    setAt(0);
    setPicked(null);
    setResults([]);
    setStreak(0);
    setCopied(false);
    setNewBest(false);
    setPhase("playing");
    shutter();
    window.scrollTo({ top: 0 });
  }, [photos]);

  const choose = useCallback(
    (option: string) => {
      if (!round || picked) return;
      const right = option === round.answer;
      setPicked(option);
      setResults((r) => [...r, right]);
      setStreak((s) => (right ? s + 1 : 0));
      if (right) {
        setFlash((f) => f + 1);
        success();
      } else {
        miss();
      }
    },
    [round, picked],
  );

  const next = useCallback(() => {
    if (!picked) return;
    if (at + 1 >= rounds.length) {
      const final = results.filter(Boolean).length;
      const prev = readBest();
      const beat = prev === null || final > prev;
      setNewBest(beat && final > 0);
      if (beat) {
        try {
          localStorage.setItem(BEST_KEY, String(final));
        } catch {
          // Storage blocked: best score only lives for this visit
        }
        setBest(final);
      }
      setPhase("done");
      return;
    }
    setAt((i) => i + 1);
    setPicked(null);
    shutter();
  }, [picked, at, rounds.length, results]);

  // Keyboard: 1-4 to answer, Enter or → for the next frame
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "intro" && e.key === "Enter") start();
      if (phase !== "playing" || !round) return;
      const n = Number(e.key);
      if (n >= 1 && n <= round.options.length) choose(round.options[n - 1]);
      if ((e.key === "Enter" || e.key === "ArrowRight") && picked) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, round, picked, choose, next, start]);

  const shareText = `I scored ${score}/${ROUNDS} guessing the camera settings on Henry Kanaskie's photos.`;

  return (
    <div style={{ minHeight: "calc(100svh - 72px)", padding: "clamp(20px, 4vw, 48px) clamp(16px, 5vw, 72px) clamp(60px, 10vh, 100px)" }}>
      {/* Correct-answer camera flash */}
      <AnimatePresence>
        {flash > 0 && (
          <motion.div
            key={flash}
            aria-hidden
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: "fixed",
              inset: 0,
              background: "#fff",
              pointerEvents: "none",
              zIndex: 65,
              mixBlendMode: isDark ? "normal" : "overlay",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.section
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "grid",
              gap: "clamp(28px, 5vw, 64px)",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
              alignItems: "center",
            }}
          >
            {/* A fanned hand of prints */}
            <div style={{ position: "relative", height: "clamp(260px, 42vw, 440px)" }} aria-hidden>
              {photos.slice(0, 5).map((_, i) => {
                const idx = Math.floor((i * photos.length) / 5);
                const ph = photos[idx].photo;
                return (
                  <motion.div
                    key={ph.src}
                    initial={{ rotate: 0, x: "-50%", y: "-50%", opacity: 0 }}
                    animate={{
                      rotate: (i - 2) * 9,
                      x: `calc(-50% + ${(i - 2) * 14}%)`,
                      y: `calc(-50% + ${Math.abs(i - 2) * 4}%)`,
                      opacity: 1,
                    }}
                    transition={{ duration: 1, delay: 0.1 + i * 0.08, ease: EASE_OUT }}
                    whileHover={{ y: "-58%", transition: { duration: 0.3 } }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: "46%",
                      aspectRatio: String(aspect(ph)),
                      maxHeight: "92%",
                      background: ph.color,
                      border: `6px solid ${isDark ? "#e9e4dc" : "#fff"}`,
                      borderBottomWidth: 22,
                      boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)",
                      overflow: "hidden",
                      zIndex: i === 2 ? 5 : 5 - Math.abs(i - 2),
                    }}
                  >
                    <Image src={ph.src} alt="" fill sizes="240px" style={{ objectFit: "cover" }} />
                  </motion.div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ ...mono, fontSize: 10, color: t.sub }}>A game · {ROUNDS} frames</div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-elevated)",
                  fontWeight: 300,
                  fontSize: "clamp(2.8rem, 7vw, 5.6rem)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.04em",
                  color: t.ink,
                }}
              >
                Guess the exposure
              </h1>
              <p style={{ margin: 0, fontSize: "clamp(1rem, 1.3vw, 1.1rem)", lineHeight: 1.7, color: t.sub, maxWidth: "46ch" }}>
                Look at a photo and pick the setting it was shot at: shutter speed, aperture, ISO or focal length. Every answer is read from
                the camera data inside the frame, and every reveal explains what that setting does.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={start}
                  style={{
                    ...mono,
                    fontSize: 11,
                    padding: "17px 30px",
                    borderRadius: 999,
                    border: "none",
                    background: t.ink,
                    color: t.bg,
                    cursor: "pointer",
                  }}
                >
                  Start shooting →
                </button>
                {best !== null && (
                  <span style={{ ...mono, fontSize: 9, color: t.faint }}>
                    Your best: {best}/{ROUNDS}
                  </span>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {phase === "playing" && round && (
          <motion.section
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}
          >
            {/* Progress rail */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, ...mono, fontSize: 9, color: t.sub }}>
              <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {pad2(at + 1)} / {pad2(rounds.length)}
              </span>
              <div style={{ flex: 1, display: "flex", gap: 4 }}>
                {rounds.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: i < results.length ? (results[i] ? "rgb(70, 190, 120)" : "rgb(225, 85, 85)") : i === at ? t.ink : t.rule,
                      transition: "background 0.3s ease",
                    }}
                  />
                ))}
              </div>
              <span style={{ whiteSpace: "nowrap", color: streak >= 2 ? t.accent : t.sub }}>
                {score} pts{streak >= 2 ? ` · ${streak} streak` : ""}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
                gap: "clamp(18px, 3vw, 40px)",
                alignItems: "start",
              }}
            >
              {/* The frame */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={round.photo.src}
                  initial={{ opacity: 0, scale: 0.97, filter: "brightness(3) blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.6, ease: EASE_OUT }}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: String(aspect(round.photo)),
                    maxHeight: frameMax,
                    justifySelf: "center",
                    borderRadius: 4,
                    overflow: "hidden",
                    background: round.photo.blur
                      ? `center / cover no-repeat url(${round.photo.blur}), ${round.photo.color}`
                      : round.photo.color,
                    boxShadow: `0 30px 80px -30px rgba(${rgbTriplet(round.photo.color)},0.6)`,
                    // Portrait frames: let height lead so they don't tower on desktop
                    ...(aspect(round.photo) < 1 ? { width: "auto", height: frameMax, maxWidth: "100%" } : {}),
                  }}
                >
                  <Image
                    src={round.photo.src}
                    alt={`${round.sectionTitle} photograph`}
                    fill
                    priority
                    sizes="(min-width: 900px) 55vw, 100vw"
                    style={{ objectFit: "cover" }}
                  />
                  {/* EXIF stamp revealed after answering */}
                  <AnimatePresence>
                    {picked && (
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          padding: "34px 14px 12px",
                          background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                          color: "#fff",
                          ...mono,
                          letterSpacing: "0.14em",
                          fontSize: 9.5,
                          lineHeight: 1.9,
                        }}
                      >
                        <div>{exposureLine(round.photo.exif)}</div>
                        <div style={{ opacity: 0.65 }}>
                          {[cameraName(round.photo.exif), round.sectionTitle].filter(Boolean).join(" · ")}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>

              {/* The question */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-elevated)",
                    fontWeight: 300,
                    fontSize: "clamp(1.5rem, 3vw, 2.4rem)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    color: t.ink,
                  }}
                >
                  What <span style={{ color: t.accent }}>{SETTING_LABEL[round.setting]}</span> was this shot at?
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {round.options.map((opt, i) => {
                    const isAnswer = opt === round.answer;
                    const isPicked = opt === picked;
                    const state = !picked ? "idle" : isAnswer ? "right" : isPicked ? "wrong" : "dim";
                    const colors = {
                      idle: { bg: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)", border: t.rule, fg: t.ink },
                      right: { bg: "rgba(70, 190, 120, 0.16)", border: "rgb(70, 190, 120)", fg: t.ink },
                      wrong: { bg: "rgba(225, 85, 85, 0.14)", border: "rgb(225, 85, 85)", fg: t.ink },
                      dim: { bg: "transparent", border: t.rule, fg: t.faint },
                    }[state];
                    return (
                      <motion.button
                        type="button"
                        key={opt}
                        onClick={() => choose(opt)}
                        disabled={!!picked}
                        whileHover={!picked ? { y: -2 } : undefined}
                        whileTap={!picked ? { scale: 0.97 } : undefined}
                        animate={state === "wrong" ? { x: [0, -8, 8, -5, 5, 0] } : state === "right" ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.4 }}
                        style={{
                          position: "relative",
                          padding: "clamp(16px, 2.2vw, 22px) 14px",
                          borderRadius: 14,
                          border: `1.5px solid ${colors.border}`,
                          background: colors.bg,
                          color: colors.fg,
                          fontFamily: "var(--font-elevated)",
                          fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
                          fontVariantNumeric: "tabular-nums",
                          cursor: picked ? "default" : "pointer",
                          textAlign: "left",
                          transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
                        }}
                      >
                        <span style={{ ...mono, fontSize: 8, color: t.faint, position: "absolute", top: 8, right: 10 }}>{i + 1}</span>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {picked && (
                    <motion.div
                      key={`reveal-${at}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                      style={{ display: "flex", flexDirection: "column", gap: 14 }}
                    >
                      <div style={{ ...mono, fontSize: 10, color: picked === round.answer ? "rgb(70, 190, 120)" : "rgb(225, 85, 85)" }}>
                        {picked === round.answer
                          ? streak >= 3
                            ? `Nailed it · ${streak} in a row`
                            : "Nailed it"
                          : `Close · it was ${round.answer}`}
                      </div>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: t.sub }}>
                        {hint(round.setting, round.photo.exif[round.setting]!)}
                      </p>
                      <button
                        type="button"
                        onClick={next}
                        autoFocus
                        style={{
                          ...mono,
                          alignSelf: "flex-start",
                          fontSize: 10,
                          padding: "14px 24px",
                          borderRadius: 999,
                          border: "none",
                          background: t.ink,
                          color: t.bg,
                          cursor: "pointer",
                        }}
                      >
                        {at + 1 >= rounds.length ? "See your score →" : "Next frame →"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        )}

        {phase === "done" && (
          <motion.section
            key="done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            style={{
              maxWidth: 900,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 20,
            }}
          >
            <div style={{ ...mono, fontSize: 10, color: t.sub }}>Your contact sheet</div>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.2 }}
              style={{
                fontFamily: "var(--font-elevated)",
                fontWeight: 300,
                fontSize: "clamp(5rem, 18vw, 11rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
                color: t.ink,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {score}
              <span style={{ color: t.faint, fontSize: "0.4em" }}>/{rounds.length}</span>
            </motion.div>
            <div style={{ fontFamily: "var(--font-elevated)", fontSize: "clamp(1.4rem, 3vw, 2rem)", color: t.accent }}>
              {rank(score).title}
            </div>
            <p style={{ margin: 0, color: t.sub, fontSize: 16 }}>
              {rank(score).line}
              {newBest ? " New personal best." : ""}
            </p>

            {/* Contact sheet of the rounds with hit and miss marks */}
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 8, width: "100%", marginTop: 12 }}
            >
              {rounds.map((r, i) => (
                <motion.div
                  key={r.photo.src}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  style={{ position: "relative", aspectRatio: "1", borderRadius: 4, overflow: "hidden", background: r.photo.color }}
                >
                  <Image src={r.photo.src} alt="" fill sizes="100px" style={{ objectFit: "cover", opacity: results[i] ? 1 : 0.45 }} />
                  <span
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "#fff",
                      background: results[i] ? "rgb(50, 170, 100)" : "rgb(210, 70, 70)",
                    }}
                  >
                    {results[i] ? "✓" : "×"}
                  </span>
                </motion.div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 16 }}>
              <button
                type="button"
                onClick={start}
                style={{
                  ...mono,
                  fontSize: 10,
                  padding: "15px 26px",
                  borderRadius: 999,
                  border: "none",
                  background: t.ink,
                  color: t.bg,
                  cursor: "pointer",
                }}
              >
                Play again
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(`${shareText} ${window.location.href}`)
                    .then(() => setCopied(true))
                    .catch(() => setCopied(false));
                }}
                style={{
                  ...mono,
                  fontSize: 10,
                  padding: "15px 26px",
                  borderRadius: 999,
                  border: `1px solid ${t.rule}`,
                  background: "transparent",
                  color: t.ink,
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied" : "Copy my score"}
              </button>
              <Link
                href="/photography"
                style={{
                  ...mono,
                  fontSize: 10,
                  padding: "15px 26px",
                  borderRadius: 999,
                  border: `1px solid ${t.rule}`,
                  color: t.ink,
                  textDecoration: "none",
                }}
              >
                See the gallery
              </Link>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
