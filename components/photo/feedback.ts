"use client";

// ─── Sound + haptic feedback ─────────────────────────────────────────────────
// Every sound is synthesised with the Web Audio API, so there are no files to
// load. Off by default; the visitor opts in with the toggle and the choice is
// remembered in localStorage.

const KEY = "photo-feedback";
const EVENT = "photoFeedbackChange";

let ctx: AudioContext | null = null;

export function feedbackEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setFeedbackEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the toggle still works for this page view
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { on } }));
  if (on) shutter();
}

export function onFeedbackChange(cb: (on: boolean) => void): () => void {
  const handler = (e: Event) => cb(!!(e as CustomEvent<{ on: boolean }>).detail?.on);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

function audio(): AudioContext | null {
  if (!feedbackEnabled()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function vibrate(pattern: number | number[]) {
  if (!feedbackEnabled()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Unsupported (iOS Safari): silently skip
  }
}

/** A short burst of filtered noise: the building block of mechanical clicks. */
function click(a: AudioContext, at: number, freq: number, gain: number, length: number) {
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * length), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    // Noise with a fast exponential decay
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
  }
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 1.4;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(at);
}

/** Two-stage mechanical shutter: the curtain opening, then closing. */
export function shutter() {
  const a = audio();
  vibrate(12);
  if (!a) return;
  const t = a.currentTime;
  click(a, t, 2600, 0.9, 0.035);
  click(a, t + 0.055, 1700, 0.7, 0.05);
}

function tone(a: AudioContext, at: number, freq: number, length: number, gain = 0.12, type: OscillatorType = "sine") {
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = a.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(g).connect(a.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/** Rising two-note chime for a correct answer. */
export function success() {
  const a = audio();
  vibrate([10, 40, 10]);
  if (!a) return;
  const t = a.currentTime;
  tone(a, t, 880, 0.25);
  tone(a, t + 0.09, 1318.5, 0.35);
}

/** Low muted thud for a miss. */
export function miss() {
  const a = audio();
  vibrate(30);
  if (!a) return;
  tone(a, a.currentTime, 150, 0.22, 0.18, "triangle");
}

/** Soft paper tap for dropping a print on the table. */
export function drop() {
  const a = audio();
  vibrate(6);
  if (!a) return;
  click(a, a.currentTime, 900, 0.35, 0.03);
}
