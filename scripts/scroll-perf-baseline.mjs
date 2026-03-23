/**
 * Baseline profiler — measures frame timing with NO scroll (page idle).
 * Helps distinguish scroll-specific cost from baseline rendering cost.
 */
import puppeteer from "puppeteer";

const URL = process.argv[2] ?? "http://localhost:3000/cs";

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

const before = await page.metrics();

// Collect frame times with NO scroll for 4 seconds
const frameTimes = await page.evaluate(() =>
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
    setTimeout(() => { cancelAnimationFrame(rafId); resolve(times); }, 4000);
  })
);

const after = await page.metrics();
await browser.close();

const valid = frameTimes.filter((t) => t > 1 && t < 500);
valid.sort((a, b) => a - b);
const pct = (p) => valid[Math.floor((p / 100) * valid.length)] ?? 0;
const avg = valid.reduce((s, t) => s + t, 0) / valid.length;

console.log("── Baseline (NO scroll, 4s idle) ────────────────────────────────");
console.log(`  avg  : ${avg.toFixed(1)}ms   p50: ${pct(50).toFixed(1)}ms   p95: ${pct(95).toFixed(1)}ms`);
console.log(`  >33ms: ${valid.filter(t=>t>33).length}   >16ms: ${valid.filter(t=>t>16).length}`);
console.log(`  Style recalcs : ${after.RecalcStyleCount - before.RecalcStyleCount}`);
console.log(`  Layout count  : ${after.LayoutCount - before.LayoutCount}`);
console.log(`  Script time   : ${(after.ScriptDuration - before.ScriptDuration).toFixed(3)}s`);
console.log(`  Style time    : ${(after.RecalcStyleDuration - before.RecalcStyleDuration).toFixed(3)}s`);
