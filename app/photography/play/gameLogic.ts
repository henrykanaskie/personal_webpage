import type { PhotoEntry } from "../data";
import { formatAperture, formatFocal, formatShutter } from "@/components/photo/utils";

export type Setting = "shutter" | "aperture" | "iso" | "focal";

export interface Round {
  photo: PhotoEntry;
  sectionTitle: string;
  setting: Setting;
  options: string[];
  answer: string;
}

export const ROUNDS = 10;

export const SETTING_LABEL: Record<Setting, string> = {
  shutter: "shutter speed",
  aperture: "aperture",
  iso: "ISO",
  focal: "focal length",
};

// Common camera values for each setting, used to build wrong answers
const LADDER: Record<Setting, number[]> = {
  shutter: [1 / 8000, 1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 4, 1, 5, 15, 30],
  aperture: [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22],
  iso: [100, 200, 400, 800, 1600, 3200, 6400, 12800],
  focal: [14, 24, 35, 50, 85, 135, 200, 300],
};

/**
 * Distance between two values in photographic stops. Shutter and ISO double
 * per stop; aperture area doubles every √2 of f-number, so it counts twice.
 */
function stops(setting: Setting, a: number, b: number): number {
  const d = Math.abs(Math.log2(a / b));
  return setting === "aperture" ? d * 2 : d;
}

// Minimum spacing so every option is a genuinely different look, not a coin flip
const MIN_GAP: Record<Setting, number> = { shutter: 1.5, aperture: 1.5, iso: 1.5, focal: 0.5 };

export function format(setting: Setting, v: number): string {
  if (setting === "shutter") return formatShutter(v)!;
  if (setting === "aperture") return formatAperture(v)!;
  if (setting === "focal") return formatFocal(v)!;
  return `ISO ${v}`;
}

function value(photo: PhotoEntry, setting: Setting): number | undefined {
  return photo.exif[setting];
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function distractors(setting: Setting, correct: number, rand: () => number): number[] {
  const picked: number[] = [];
  for (const v of shuffle(LADDER[setting], rand)) {
    const farFromAnswer = stops(setting, v, correct) >= MIN_GAP[setting];
    const farFromOthers = picked.every((p) => stops(setting, v, p) >= MIN_GAP[setting] * 0.66);
    if (farFromAnswer && farFromOthers) picked.push(v);
    if (picked.length === 3) break;
  }
  return picked;
}

/** Ten rounds over distinct photos, cycling through the settings evenly. */
export function buildRounds(pool: { photo: PhotoEntry; sectionTitle: string }[], rand: () => number = Math.random): Round[] {
  const settings: Setting[] = shuffle(["shutter", "aperture", "iso", "focal"], rand);
  const rounds: Round[] = [];
  const photos = shuffle(pool, rand);

  for (let i = 0; rounds.length < ROUNDS && i < photos.length * 4; i++) {
    const setting = settings[rounds.length % settings.length];
    const candidate = photos.find((p) => value(p.photo, setting) && !rounds.some((r) => r.photo.src === p.photo.src));
    if (!candidate) {
      settings.push(settings.shift()!);
      continue;
    }
    const correct = value(candidate.photo, setting)!;
    const wrong = distractors(setting, correct, rand);
    if (wrong.length < 3) continue;
    const answer = format(setting, correct);
    rounds.push({
      ...candidate,
      setting,
      answer,
      options: shuffle([answer, ...wrong.map((v) => format(setting, v))], rand),
    });
  }
  return rounds;
}

/** One line of real photographic reasoning about the value that was used. */
export function hint(setting: Setting, v: number): string {
  switch (setting) {
    case "shutter":
      if (v >= 1) return "A long exposure. The camera sat still on a tripod, gathering light the whole time.";
      if (v <= 1 / 1000) return "Fast enough to freeze motion completely.";
      if (v >= 1 / 60) return "Slow for handheld. Steady hands, a brace, or a still subject.";
      return "An everyday handheld speed: quick enough to stay sharp.";
    case "aperture":
      if (v <= 2.8) return "Wide open: lots of light and a shallow slice of focus.";
      if (v <= 5.6) return "A middle aperture that keeps the whole subject sharp.";
      return "Stopped down so everything from front to back stays sharp.";
    case "iso":
      if (v <= 200) return "Base ISO: plenty of light and the cleanest image the sensor makes.";
      if (v <= 1600) return "A moderate ISO bump to keep the shutter speed up.";
      return "High ISO: pulling detail out of very little light.";
    case "focal":
      if (v <= 35) return "Wide angle: takes in the whole scene and exaggerates depth.";
      if (v <= 60) return "Close to how your own eye sees the world.";
      return "Telephoto: flattens depth and isolates the subject.";
  }
}

export function rank(score: number): { title: string; line: string } {
  if (score >= 9) return { title: "Darkroom master", line: "You could have shot these yourself." };
  if (score >= 7) return { title: "Full manual", line: "You read light like a light meter." };
  if (score >= 4) return { title: "Aperture priority", line: "Solid instincts. A few more rolls and you're there." };
  return { title: "Auto mode", line: "Everyone starts here. Play again and watch the hints." };
}
