/**
 * Scroll performance profiler for the CS page.
 * Usage: node scripts/scroll-perf.mjs [url]
 */
import puppeteer from "puppeteer";

const URL = process.argv[2] ?? "http://localhost:3000/cs";
const SCROLL_DURATION_MS = 8000;

console.log(`Profiling: ${URL}\n`);

const browser = await puppeteer.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500)); // let animations settle

// Snapshot metrics before scroll
const before = await page.metrics();

// Start frame-timing collector and scroll simulation together
const [frameTimes] = await Promise.all([
  // Collect rAF frame intervals inside the browser for the duration of the scroll
  page.evaluate(
    (duration) =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now();
        let rafId;
        const tick = () => {
          const now = performance.now();
          times.push(now - last);
          last = now;
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        setTimeout(() => {
          cancelAnimationFrame(rafId);
          resolve(times);
        }, duration + 500);
      }),
    SCROLL_DURATION_MS
  ),

  // Scroll down then up over the same duration
  (async () => {
    const half = SCROLL_DURATION_MS / 2;
    const interval = 16;
    const steps = Math.floor(half / interval);
    // Scroll down
    for (let i = 0; i < steps; i++) {
      await page.evaluate(() => window.scrollBy(0, 8));
      await new Promise((r) => setTimeout(r, interval));
    }
    // Scroll up
    for (let i = 0; i < steps; i++) {
      await page.evaluate(() => window.scrollBy(0, -8));
      await new Promise((r) => setTimeout(r, interval));
    }
  })(),
]);

// Snapshot metrics after scroll
const after = await page.metrics();
await browser.close();

// --- Analyse ---
const valid = frameTimes.filter((t) => t > 1 && t < 500);
valid.sort((a, b) => a - b);
const pct = (p) => valid[Math.floor((p / 100) * valid.length)] ?? 0;

const jank33 = valid.filter((t) => t > 33).length; // below 30fps
const jank50 = valid.filter((t) => t > 50).length; // long animation frame
const avg = valid.reduce((s, t) => s + t, 0) / valid.length;

const delta = (key) => ((after[key] ?? 0) - (before[key] ?? 0)).toFixed(3);

console.log("── Frame Timing (inside browser during scroll) ─────────────────");
console.log(`  Frames measured : ${valid.length}`);
console.log(`  avg             : ${avg.toFixed(1)}ms   (ideal: 16ms)`);
console.log(`  p50             : ${pct(50).toFixed(1)}ms`);
console.log(`  p95             : ${pct(95).toFixed(1)}ms`);
console.log(`  p99             : ${pct(99).toFixed(1)}ms`);
console.log(
  `  >33ms  (<30fps) : ${jank33}  (${((jank33 / valid.length) * 100).toFixed(1)}%)`
);
console.log(
  `  >50ms  (LoAF)   : ${jank50}  (${((jank50 / valid.length) * 100).toFixed(1)}%)`
);

console.log("\n── Chrome Metrics delta (scroll period) ────────────────────────");
console.log(`  Layout count    : ${(after.LayoutCount - before.LayoutCount)}`);
console.log(`  Style recalcs   : ${(after.RecalcStyleCount - before.RecalcStyleCount)}`);
console.log(`  Script time     : ${delta("ScriptDuration")}s`);
console.log(`  Layout time     : ${delta("LayoutDuration")}s`);
console.log(`  Style recalc    : ${delta("RecalcStyleDuration")}s`);
console.log(`  JS heap used    : ${(after.JSHeapUsedSize / 1024 / 1024).toFixed(1)} MB`);

console.log("\n── Verdict ──────────────────────────────────────────────────────");
if (pct(95) <= 16) {
  console.log("  ✓ Smooth (p95 ≤ 16ms)");
} else if (pct(95) <= 33) {
  console.log("  ~ Mostly smooth, some dips below 30fps (16 < p95 ≤ 33ms)");
} else {
  console.log(`  ✗ Jank (p95 = ${pct(95).toFixed(1)}ms > 33ms)`);
}
const sd = after.ScriptDuration - before.ScriptDuration;
const ld = after.LayoutDuration - before.LayoutDuration;
const rd = after.RecalcStyleDuration - before.RecalcStyleDuration;
if (ld > 0.05) console.log("  ⚠  High layout time — forced reflows during scroll");
if (rd > 0.1)  console.log("  ⚠  High style recalc — compositing / class churn");
if (sd > 1.0)  console.log("  ⚠  High JS time — main-thread work during scroll");
