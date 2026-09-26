"use client";

import type { PhotoHistogram } from "@/app/photography/data";
import Histogram from "../Histogram";
import type { PhotoTheme } from "../utils";
import { NEUTRAL, type DevelopParams } from "./engine";

type Key = keyof DevelopParams;

// Film stock looks, expressed in the same controls a visitor can then tweak
export const PRESETS: { name: string; params: Partial<DevelopParams> }[] = [
  { name: "Original", params: {} },
  {
    name: "Portra",
    params: { temperature: 0.25, contrast: -0.12, fade: 0.35, vibrance: 0.2, shadows: 0.15, highlights: -0.2, grain: 0.25 },
  },
  { name: "Tri-X", params: { saturation: -1, contrast: 0.35, grain: 0.5, vignette: 0.35, fade: 0.1 } },
  { name: "Velvia", params: { saturation: 0.35, vibrance: 0.3, contrast: 0.2, shadows: -0.1 } },
  { name: "Cinema", params: { temperature: -0.2, tint: -0.1, contrast: 0.15, fade: 0.2, vignette: 0.45, highlights: -0.2 } },
  { name: "Faded", params: { fade: 0.6, contrast: -0.25, saturation: -0.25, temperature: 0.1 } },
];

const GROUPS: { title: string; controls: { key: Key; label: string; min: number; max: number }[] }[] = [
  {
    title: "Light",
    controls: [
      { key: "exposure", label: "Exposure", min: -2, max: 2 },
      { key: "contrast", label: "Contrast", min: -1, max: 1 },
      { key: "highlights", label: "Highlights", min: -1, max: 1 },
      { key: "shadows", label: "Shadows", min: -1, max: 1 },
    ],
  },
  {
    title: "Colour",
    controls: [
      { key: "temperature", label: "Temperature", min: -1, max: 1 },
      { key: "tint", label: "Tint", min: -1, max: 1 },
      { key: "vibrance", label: "Vibrance", min: -1, max: 1 },
      { key: "saturation", label: "Saturation", min: -1, max: 1 },
    ],
  },
  {
    title: "Effects",
    controls: [
      { key: "fade", label: "Fade", min: 0, max: 1 },
      { key: "vignette", label: "Vignette", min: 0, max: 1 },
      { key: "grain", label: "Grain", min: 0, max: 1 },
    ],
  },
];

function display(key: Key, v: number): string {
  if (key === "exposure") return `${v >= 0 ? "+" : ""}${v.toFixed(2)} EV`;
  const n = Math.round(v * 100);
  return n > 0 && key !== "fade" && key !== "vignette" && key !== "grain" ? `+${n}` : String(n);
}

export function presetParams(name: string): DevelopParams {
  return { ...NEUTRAL, ...(PRESETS.find((p) => p.name === name)?.params ?? {}) };
}

export default function DevelopPanel({
  params,
  onChange,
  preset,
  onPreset,
  split,
  onToggleSplit,
  hist,
  isDark,
  t,
}: {
  params: DevelopParams;
  onChange: (p: DevelopParams) => void;
  preset: string | null;
  onPreset: (name: string) => void;
  split: boolean;
  onToggleSplit: () => void;
  hist: PhotoHistogram;
  isDark: boolean;
  t: PhotoTheme;
}) {
  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  };
  const chip = (active: boolean): React.CSSProperties => ({
    ...mono,
    fontSize: 8.5,
    padding: "8px 11px",
    borderRadius: 999,
    border: `1px solid ${active ? t.ink : t.rule}`,
    background: active ? t.ink : "transparent",
    color: active ? t.bg : t.ink,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });
  const edited = (Object.keys(NEUTRAL) as Key[]).some((k) => params[k] !== NEUTRAL[k]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <div style={{ ...mono, fontSize: 8.5, color: t.faint, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
          <span>Live histogram</span>
          <span>GPU · WebGL2</span>
        </div>
        <Histogram hist={hist} isDark={isDark} />
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => onPreset(p.name)} style={chip(preset === p.name)}>
            {p.name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" onClick={onToggleSplit} aria-pressed={split} style={chip(split)}>
          Before / after
        </button>
        <button type="button" onClick={() => onPreset("Original")} disabled={!edited} style={{ ...chip(false), opacity: edited ? 1 : 0.4 }}>
          Reset
        </button>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} style={{ display: "grid", gap: 10 }}>
          <div style={{ ...mono, fontSize: 8.5, color: t.faint }}>{group.title}</div>
          {group.controls.map(({ key, label, min, max }) => {
            const v = params[key];
            const id = `develop-${key}`;
            return (
              <div key={key} style={{ display: "grid", gap: 4 }}>
                <label
                  htmlFor={id}
                  onDoubleClick={() => onChange({ ...params, [key]: NEUTRAL[key] })}
                  title="Double-click to reset"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    color: v !== NEUTRAL[key] ? t.ink : t.sub,
                    cursor: "default",
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: t.sub }}>{display(key, v)}</span>
                </label>
                <input
                  id={id}
                  className="develop-range"
                  type="range"
                  min={min}
                  max={max}
                  step={key === "exposure" ? 0.05 : 0.01}
                  value={v}
                  onChange={(e) => onChange({ ...params, [key]: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: t.accent }}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
