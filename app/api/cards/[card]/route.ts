/**
 * Live GitHub profile cards, rendered as SVG at request time.
 *
 * The profile README embeds these, so what a visitor sees is generated when
 * they load the page rather than baked into a committed file. Upstream GitHub
 * calls are cached for ten minutes (one page view would otherwise cost eleven
 * API requests); the response itself is uncacheable so GitHub's image proxy
 * revalidates instead of pinning a copy.
 *
 *   /api/cards/languages?theme=dark
 *   /api/cards/{languages|stats|activity|projects|focus}
 */

export const dynamic = "force-dynamic";

const USER = "henrykanaskie";
const ACTIVITY_DAYS = 30;
const UPSTREAM_TTL = 600;

type Theme = {
  name: string; bg: string; border: string; title: string;
  text: string; muted: string; track: string;
};

const THEMES: Record<string, Theme> = {
  light: { name: "light", bg: "#ffffff", border: "#d0d7de", title: "#1f2328", text: "#1f2328", muted: "#656d76", track: "#eaeef2" },
  dark: { name: "dark", bg: "#0d1117", border: "#30363d", title: "#e6edf3", text: "#e6edf3", muted: "#8b949e", track: "#21262d" },
};

const LANG_COLORS: Record<string, string> = {
  Python: "#3572A5", C: "#555555", "C++": "#f34b7d", JavaScript: "#f1e05a",
  TypeScript: "#3178c6", Swift: "#F05138", R: "#198CE7", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", "Jupyter Notebook": "#DA5B0B",
};

const STAGE_COLORS: Record<string, [string, string]> = {
  shipped: ["#3fb950", "#2ea043"],
  active: ["#58a6ff", "#1f6feb"],
  "in progress": ["#d29922", "#bb8009"],
  scaffold: ["#bc8cff", "#8957e5"],
};

// Stage is a band of the progress figure, not an independent label, so a
// scaffold can never outrank something active:
//   scaffold < 25 <= in progress < 45 <= active < 90 <= shipped
const PROJECTS: [string, string, string, number][] = [
  ["Cap_Match_Net", "Capacitor matching via OR-Tools", "shipped", 1.0],
  ["small-shell", "Unix shell in C: jobs, signals, redirection", "shipped", 1.0],
  ["ML_quantitative_research", "Block bootstrap, log-return modeling", "active", 0.6],
  ["rLog", "Voice-driven logging, code not yet pushed", "active", 0.55],
  ["gpt-scratch", "Attention and foundations done, no GPT yet", "active", 0.45],
  ["me-tutor", "3 of ~14 modules written and verified", "in progress", 0.25],
  ["GrowthApp", "Running skeleton, one orb variant real", "scaffold", 0.22],
  ["pitwall", "One regression file, frontend empty", "scaffold", 0.18],
];

const FOCUS: [string, string][] = [
  ["machine learning", "#3572A5"], ["transformers", "#8957e5"],
  ["quantitative research", "#3fb950"], ["time series", "#1f6feb"],
  ["optimization", "#d29922"], ["embedded C", "#555555"],
  ["signal processing", "#f34b7d"], ["SwiftUI", "#F05138"],
  ["agents", "#bc8cff"], ["numerical methods", "#198CE7"],
];

const EXCLUDE_LANGS = new Set(["CSS", "HTML"]);

// ── helpers ───────────────────────────────────────────────────────────────

const esc = (s: unknown) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Lift very dark accents so they stay legible on a dark card. */
function adapt(color: string, theme: string): string {
  if (theme !== "dark") return color;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum >= 0.38) return color;
  const mix = (c: number) => Math.round(c + (255 - c) * 0.55);
  return "#" + [r, g, b].map((c) => mix(c).toString(16).padStart(2, "0")).join("");
}

/**
 * Staggered fade-in. The element keeps its normal opacity as the base
 * attribute, so a renderer that ignores SMIL shows a still card, not a blank.
 */
const fade = (delay: number, dur = 0.45) =>
  `<animate attributeName="opacity" from="0" to="1" dur="${dur}s" begin="${delay.toFixed(2)}s" fill="freeze"/>`;

const grow = (attr: string, to: number | string, delay: number, dur = 0.85) =>
  `<animate attributeName="${attr}" from="0" to="${to}" dur="${dur}s" begin="${delay.toFixed(2)}s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1"/>`;

const shell = (w: number, h: number, t: Theme, body: string, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ` +
  `font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif">` +
  `<defs>${defs}</defs>` +
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="${t.bg}" stroke="${t.border}"/>` +
  `${body}</svg>`;

async function gh<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    "User-Agent": "profile-cards",
    Accept: "application/vnd.github+json",
  };
  // Unauthenticated GitHub allows 60 requests/hour per IP, shared across every
  // tenant on this egress address. A token makes the endpoint dependable.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, next: { revalidate: UPSTREAM_TTL } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}

// ── data ──────────────────────────────────────────────────────────────────

type Repo = { name: string; fork: boolean; languages_url: string };

/**
 * Language mix with every repository weighted equally.
 *
 * Summing raw bytes lets a single verbose project speak for the whole profile:
 * one Next.js site was 359 KB of the 787 KB total and read as 46% TypeScript,
 * against Python being the primary language in seven of nine repositories. So
 * each repo contributes its own percentage breakdown and those are averaged.
 * Byte totals are still returned for the "code written" figure.
 */
async function fetchLanguages(): Promise<{ dist: [string, number][]; bytes: number }> {
  const repos = await gh<Repo[]>(`https://api.github.com/users/${USER}/repos?per_page=100`);
  const sets = await Promise.all(
    repos.filter((r) => !r.fork).map((r) => gh<Record<string, number>>(r.languages_url).catch(() => ({}))),
  );

  const acc: Record<string, number> = {};
  let bytes = 0;
  let counted = 0;
  for (const set of sets) {
    const kept = Object.entries(set).filter(([k]) => !EXCLUDE_LANGS.has(k));
    const sum = kept.reduce((a, [, v]) => a + v, 0);
    bytes += sum;
    if (sum < 500) continue;          // skip empty or placeholder repos
    counted++;
    for (const [k, v] of kept) acc[k] = (acc[k] ?? 0) + v / sum;
  }
  void counted;
  return { dist: Object.entries(acc).sort((a, b) => b[1] - a[1]), bytes };
}

type Ev = { type: string; created_at: string; repo: { name: string } };

async function fetchActivity() {
  const events = await gh<Ev[]>(`https://api.github.com/users/${USER}/events/public?per_page=100`);
  const perDay: Record<string, number> = {};
  const repos: Record<string, number> = {};
  let last: string | null = null;
  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const day = e.created_at.slice(0, 10);
    perDay[day] = (perDay[day] ?? 0) + 1;
    repos[e.repo.name] = (repos[e.repo.name] ?? 0) + 1;
    if (!last || e.created_at > last) last = e.created_at;
  }
  const series: [Date, number][] = [];
  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    series.push([d, perDay[d.toISOString().slice(0, 10)] ?? 0]);
  }
  const top = Object.entries(repos).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return { series, top, last };
}

// ── cards ─────────────────────────────────────────────────────────────────

function cardLanguages(langs: [string, number][], t: Theme) {
  const w = 440, pad = 20;
  const total = langs.reduce((a, [, v]) => a + v, 0) || 1;
  const shown = langs.slice(0, 6);
  const barY = 50, barW = w - 2 * pad, barH = 10;

  const defs =
    `<clipPath id="bar"><rect x="${pad}" y="${barY}" width="${barW}" height="${barH}" rx="5"/></clipPath>` +
    `<clipPath id="reveal"><rect x="${pad}" y="${barY}" width="${barW}" height="${barH}">${grow("width", barW, 0.15, 1.0)}</rect></clipPath>`;

  let body = `<text x="${pad}" y="34" fill="${t.title}" font-size="15" font-weight="600">Languages</text>`;
  body += `<rect x="${pad}" y="${barY}" width="${barW}" height="${barH}" rx="5" fill="${t.track}"/>`;
  body += `<g clip-path="url(#bar)"><g clip-path="url(#reveal)">`;
  let x = pad;
  for (const [name, val] of shown) {
    const seg = (barW * val) / total;
    body += `<rect x="${x.toFixed(2)}" y="${barY}" width="${seg.toFixed(2)}" height="${barH}" fill="${adapt(LANG_COLORS[name] ?? "#8b949e", t.name)}"/>`;
    x += seg;
  }
  body += `</g></g>`;

  shown.forEach(([name, val], i) => {
    const col = i % 2;
    const lx = pad + col * (barW / 2);
    const ly = 88 + Math.floor(i / 2) * 26;
    // Anchor each percentage to its column's right edge rather than a fixed
    // offset from the name, so the right-hand column ends flush with the bar
    // instead of stopping short of it.
    const pctX = col === 0 ? pad + barW / 2 - 24 : pad + barW;
    const dot = adapt(LANG_COLORS[name] ?? "#8b949e", t.name);
    body +=
      `<g>${fade(0.4 + i * 0.07)}` +
      `<circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${dot}"/>` +
      `<text x="${lx + 18}" y="${ly}" fill="${t.text}" font-size="12.5" font-weight="500">${esc(name)}</text>` +
      `<text x="${pctX.toFixed(0)}" y="${ly}" fill="${t.muted}" font-size="12.5" text-anchor="end">${((100 * val) / total).toFixed(1)}%</text></g>`;
  });

  const h = 88 + Math.ceil(shown.length / 2) * 26 + 26;
  body += `<text x="${pad}" y="${h - 12}" fill="${t.muted}" font-size="10.5">each repo weighted equally, generated and vendored files excluded</text>`;
  return shell(w, h, t, body, defs);
}

function cardStats(stats: [string, string, string][], t: Theme) {
  const w = 900, pad = 24, cols = 3, cellH = 62, top = 56;
  const cellW = (w - 2 * pad) / cols;
  let body = `<text x="${pad}" y="34" fill="${t.title}" font-size="15" font-weight="600">By the numbers</text>`;
  stats.forEach(([label, value, raw], i) => {
    const c = adapt(raw, t.name);
    const cx = pad + (i % cols) * cellW;
    const cy = top + Math.floor(i / cols) * cellH;
    body +=
      `<g>${fade(0.15 + i * 0.08)}` +
      `<rect x="${cx}" y="${cy}" width="${(cellW - 12).toFixed(0)}" height="${cellH - 12}" rx="8" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-opacity="0.28"/>` +
      `<text x="${cx + 16}" y="${cy + 30}" fill="${c}" font-size="21" font-weight="700">${esc(value)}</text>` +
      `<text x="${cx + 16}" y="${cy + 44}" fill="${t.muted}" font-size="10.5">${esc(label)}</text></g>`;
  });
  return shell(w, top + Math.ceil(stats.length / cols) * cellH + 8, t, body);
}

function cardActivity(series: [Date, number][], top: [string, number][], last: string | null, t: Theme) {
  const w = 900, pad = 24, topY = 66, chartH = 76;
  const h = topY + chartH + 46;
  const peak = Math.max(...series.map(([, n]) => n), 0) || 1;
  const slot = (w - 2 * pad) / series.length;
  const bw = slot * 0.62;
  const base = topY + chartH;

  let body = `<text x="${pad}" y="34" fill="${t.title}" font-size="15" font-weight="600">Recent activity</text>`;
  body += `<text x="${pad}" y="52" fill="${t.muted}" font-size="11.5">Pushes per day, last ${series.length} days, read live when you loaded this page</text>`;
  body += `<line x1="${pad}" y1="${base + 0.5}" x2="${w - pad}" y2="${base + 0.5}" stroke="${t.border}"/>`;

  series.forEach(([, n], i) => {
    const x = pad + i * slot;
    if (n === 0) {
      body += `<rect x="${x.toFixed(1)}" y="${base - 3}" width="${bw.toFixed(1)}" height="3" rx="1.5" fill="${t.track}"/>`;
      return;
    }
    const bh = Math.max(4, ((chartH - 10) * n) / peak);
    const d = (0.2 + i * 0.02).toFixed(2);
    body +=
      `<rect x="${x.toFixed(1)}" y="${base}" width="${bw.toFixed(1)}" height="0" rx="2" fill="#3fb950">` +
      `<animate attributeName="height" from="0" to="${bh.toFixed(1)}" dur="0.7s" begin="${d}s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1"/>` +
      `<animate attributeName="y" from="${base}" to="${(base - bh).toFixed(1)}" dur="0.7s" begin="${d}s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1"/>` +
      `</rect>`;
  });

  const seen = new Set<string>();
  series.forEach(([d], i) => {
    const m = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    if (seen.has(m)) return;
    seen.add(m);
    body += `<text x="${(pad + i * slot).toFixed(0)}" y="${base + 16}" fill="${t.muted}" font-size="10">${m} ${d.getUTCDate()}</text>`;
  });

  let foot = top.length ? "most active: " + top.map(([r]) => r.split("/").pop()).join(", ") : "";
  if (last) foot += `  ·  last push ${last.slice(0, 10)}`;
  body += `<text x="${pad}" y="${h - 14}" fill="${t.muted}" font-size="10.5">${fade(1.0)}${esc(foot)}</text>`;
  return shell(w, h, t, body);
}

function cardProjects(t: Theme) {
  // Rows are a four-column grid: status dot + name/description, progress bar,
  // percentage, stage label. The unfilled track is tinted with the row's own
  // stage colour rather than left grey, which was reading as a stray pill.
  const w = 900, pad = 28, rowH = 56, headH = 72;
  const h = headH + PROJECTS.length * rowH + 40;
  const barX = 452, barW = 250, barH = 8;
  const pctX = 766;                       // right edge; clears the widest stage label
  const labelX = w - pad;                 // right edge of the stage label

  let defs = "";
  for (const [stage, [c1, c2]] of Object.entries(STAGE_COLORS))
    defs += `<linearGradient id="g${stage.replace(/ /g, "")}" x1="0" x2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;

  let body = `<text x="${pad}" y="34" fill="${t.title}" font-size="16" font-weight="600" letter-spacing="-0.2">Project stage</text>`;
  body += `<text x="${pad}" y="54" fill="${t.muted}" font-size="11.5">Where each project actually sits. A status readout, not a roadmap.</text>`;
  body += `<line x1="${pad}" y1="${headH - 0.5}" x2="${w - pad}" y2="${headH - 0.5}" stroke="${t.border}"/>`;

  PROJECTS.forEach(([name, desc, stage, frac], i) => {
    const gid = "g" + stage.replace(/ /g, "");
    const accent = adapt(STAGE_COLORS[stage][0], t.name);
    const rowY = headH + i * rowH;
    const midY = rowY + rowH / 2;
    const delay = 0.18 + i * 0.08;

    if (i) body += `<line x1="${pad}" y1="${rowY - 0.5}" x2="${w - pad}" y2="${rowY - 0.5}" stroke="${t.border}" stroke-opacity="0.5"/>`;

    body += `<circle cx="${pad + 4}" cy="${midY - 5}" r="4" fill="${accent}"/>`;
    body += `<text x="${pad + 18}" y="${midY - 1}" fill="${t.text}" font-size="13.5" font-weight="600">${esc(name)}</text>`;
    body += `<text x="${pad + 18}" y="${midY + 15}" fill="${t.muted}" font-size="11">${esc(desc)}</text>`;

    // Track tinted with the stage colour, then the gradient fill over it.
    body += `<rect x="${barX}" y="${midY - barH / 2}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="${accent}" fill-opacity="0.14"/>`;
    body += `<rect x="${barX}" y="${midY - barH / 2}" width="${(barW * frac).toFixed(1)}" height="${barH}" rx="${barH / 2}" fill="url(#${gid})">${grow("width", (barW * frac).toFixed(1), delay)}</rect>`;

    body += `<text x="${pctX}" y="${midY + 4}" fill="${accent}" font-size="13" font-weight="700" text-anchor="end">${fade(delay + 0.45)}${Math.round(frac * 100)}%</text>`;
    body += `<text x="${labelX}" y="${midY + 4}" fill="${accent}" fill-opacity="0.85" font-size="9.5" font-weight="600" letter-spacing="0.9" text-anchor="end">${fade(delay + 0.5)}${esc(stage.toUpperCase())}</text>`;
  });

  body += `<text x="${pad}" y="${h - 14}" fill="${t.muted}" font-size="10">scaffold under 25%  ·  in progress 25 to 45  ·  active 45 to 90  ·  shipped 90 and up</text>`;
  return shell(w, h, t, body, defs);
}

function cardFocus(t: Theme) {
  const w = 440, pad = 20;
  let body = `<text x="${pad}" y="34" fill="${t.title}" font-size="15" font-weight="600">Focus areas</text>`;
  let x = pad, y = 58;
  FOCUS.forEach(([label, raw], i) => {
    const color = adapt(raw, t.name);
    const pw = 20 + label.length * 6.5;
    if (x + pw > w - pad) { x = pad; y += 30; }
    body +=
      `<g>${fade(0.2 + i * 0.06)}` +
      `<rect x="${x}" y="${y - 14}" width="${pw.toFixed(0)}" height="22" rx="11" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-opacity="0.5"/>` +
      `<text x="${(x + pw / 2).toFixed(0)}" y="${y + 1}" fill="${color}" font-size="11.5" font-weight="600" text-anchor="middle">${esc(label)}</text></g>`;
    x += pw + 8;
  });
  return shell(w, y + 30, t, body);
}

// ── handler ───────────────────────────────────────────────────────────────

export async function GET(req: Request, ctx: { params: Promise<{ card: string }> }) {
  const { card } = await ctx.params;
  const url = new URL(req.url);
  const t = THEMES[url.searchParams.get("theme") === "dark" ? "dark" : "light"];

  let svg: string;
  try {
    switch (card.replace(/\.svg$/, "")) {
      case "languages":
        svg = cardLanguages((await fetchLanguages()).dist, t);
        break;
      case "focus":
        svg = cardFocus(t);
        break;
      case "projects":
        svg = cardProjects(t);
        break;
      case "activity": {
        const a = await fetchActivity();
        svg = cardActivity(a.series, a.top, a.last, t);
        break;
      }
      case "stats": {
        const [langs, act, user] = await Promise.all([
          fetchLanguages(),
          fetchActivity(),
          gh<{ public_repos: number; created_at: string }>(`https://api.github.com/users/${USER}`),
        ]);
        const total = langs.dist.reduce((a, [, v]) => a + v, 0) || 1;
        const [topName, topVal] = langs.dist[0] ?? ["n/a", 0];
        svg = cardStats(
          [
            ["Public repos", String(user.public_repos), "#58a6ff"],
            ["Languages", String(langs.dist.length), "#bc8cff"],
            [topName, `${Math.round((100 * topVal) / total)}%`, "#3572A5"],
            ["Code written", `${Math.round(langs.bytes / 1024)} KB`, "#3fb950"],
            [`Pushes, last ${ACTIVITY_DAYS}d`, String(act.series.reduce((a, [, n]) => a + n, 0)), "#f34b7d"],
            ["On GitHub since", user.created_at.slice(0, 4), "#d29922"],
          ],
          t,
        );
        break;
      }
      default:
        return new Response("unknown card", { status: 404 });
    }
  } catch (err) {
    // Never hand back a broken image: a readable card beats a broken one.
    svg = shell(440, 90, t,
      `<text x="20" y="36" fill="${t.title}" font-size="14" font-weight="600">Card unavailable</text>` +
      `<text x="20" y="58" fill="${t.muted}" font-size="11">${esc(String(err).slice(0, 70))}</text>`);
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // GitHub's image proxy pins anything cacheable, which would freeze these.
      "Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
    },
  });
}
