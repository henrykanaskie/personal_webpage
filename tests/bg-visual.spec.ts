/**
 * Background Visual Regression Test Suite
 *
 * Tests background color/image consistency across mobile vs desktop viewports,
 * and catches reload-related issues (FOUC, hydration drift, stale caching).
 *
 * Setup:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *   npx playwright test tests/bg-visual.spec.ts
 *
 * Requires the app to be running: npm run dev (default: http://localhost:3000)
 */

import { test, expect, Page, Browser } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
  { name: "iphone-se", width: 375, height: 667, isMobile: true },
  { name: "iphone-14", width: 390, height: 844, isMobile: true },
  { name: "android", width: 360, height: 800, isMobile: true },
];

const ROUTES = [
  { name: "home", path: "/" },
  { name: "cs", path: "/cs" },
  { name: "about", path: "/about" },
  { name: "resume", path: "/resume" },
  { name: "photography", path: "/photography" },
];

/** Background-related CSS properties to inspect on key containers */
const BG_PROPS = [
  "background-color",
  "background-image",
  "background-size",
  "background-attachment",
  "background-position",
] as const;

/** Key DOM selectors to inspect for background styles */
const KEY_SELECTORS = ["html", "body", "main", "#__next", "[data-testid]"];

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Navigate and wait for full network quiescence */
async function gotoAndWait(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  // Extra settle time for JS-driven backgrounds (framer-motion, useIsDark effect)
  await page.waitForTimeout(600);
}

/**
 * Collect computed background styles for html, body, and the first-child of main.
 * Returns a plain object so it can be JSON-serialised across the evaluate boundary.
 */
async function collectBgStyles(page: Page): Promise<Record<string, Record<string, string>>> {
  return page.evaluate((props) => {
    const selectors: Record<string, string> = {
      html: "html",
      body: "body",
      main: "main",
      firstSection: "main > *:first-child",
    };

    const result: Record<string, Record<string, string>> = {};

    for (const [label, sel] of Object.entries(selectors)) {
      const el = document.querySelector(sel);
      if (!el) {
        result[label] = { _missing: "true" };
        continue;
      }
      const computed = getComputedStyle(el);
      const styles: Record<string, string> = {};
      for (const prop of props) {
        styles[prop] = computed.getPropertyValue(prop).trim();
      }
      // Also capture inline style overrides separately
      const inline: Record<string, string> = {};
      for (const prop of props) {
        const val = (el as HTMLElement).style?.getPropertyValue(prop);
        if (val) inline[`inline:${prop}`] = val;
      }
      result[label] = { ...styles, ...inline };
    }
    return result;
  }, [...BG_PROPS]);
}

/**
 * Capture full-page screenshot and return its path.
 */
async function screenshot(page: Page, label: string): Promise<string> {
  const filePath = path.join(SCREENSHOT_DIR, `${label}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

/**
 * Hard-reload (bypass cache) and wait.
 */
async function hardReload(page: Page) {
  await page.evaluate(() => {
    // Force cache-busted reload
    location.reload();
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
}

/**
 * Check whether `background-attachment: fixed` is present anywhere — known
 * to be broken on iOS Safari.
 */
async function checkFixedAttachment(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const hits: string[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const ba = getComputedStyle(el).backgroundAttachment;
      if (ba === "fixed") {
        hits.push(el.tagName + (el.id ? `#${el.id}` : "") + (el.className ? `.${String(el.className).split(" ")[0]}` : ""));
      }
    });
    return hits;
  });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe("Background Visual Regression", () => {
  // Baseline: collect desktop styles for every route once
  const desktopBaselines: Record<string, Record<string, Record<string, string>>> = {};

  // ── 1. Capture desktop baselines ────────────────────────────────────────────
  test.describe("Desktop baselines", () => {
    for (const route of ROUTES) {
      test(`Capture desktop baseline — ${route.name}`, async ({ browser }) => {
        const ctx = await browser.newContext({
          viewport: { width: 1440, height: 900 },
        });
        const page = await ctx.newPage();

        await gotoAndWait(page, `${BASE_URL}${route.path}`);
        const styles = await collectBgStyles(page);
        desktopBaselines[route.name] = styles;

        await screenshot(page, `desktop-1440_${route.name}_initial`);

        // Soft reload
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(600);
        const afterReload = await collectBgStyles(page);
        await screenshot(page, `desktop-1440_${route.name}_after-soft-reload`);

        // Compare pre/post soft-reload styles
        for (const [selector, props] of Object.entries(styles)) {
          for (const [prop, before] of Object.entries(props)) {
            const after = afterReload[selector]?.[prop] ?? "";
            if (before !== after) {
              console.warn(
                `[RELOAD DRIFT] desktop ${route.name} • ${selector} • ${prop}: "${before}" → "${after}"`
              );
            }
          }
        }

        await ctx.close();
      });
    }
  });

  // ── 2. Mobile vs desktop comparison ─────────────────────────────────────────
  for (const vp of VIEWPORTS.filter((v) => v.isMobile)) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      for (const route of ROUTES) {
        test(`${vp.name} vs desktop — ${route.name}`, async ({ browser }) => {
          const ctx = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            isMobile: true,
            hasTouch: true,
          });
          const page = await ctx.newPage();

          await gotoAndWait(page, `${BASE_URL}${route.path}`);
          const mobileStyles = await collectBgStyles(page);
          await screenshot(page, `${vp.name}_${route.name}_initial`);

          // Check for background-attachment: fixed (broken on mobile Safari)
          const fixedAttachmentEls = await checkFixedAttachment(page);
          if (fixedAttachmentEls.length > 0) {
            console.warn(
              `[MOBILE BUG] ${vp.name} ${route.name}: background-attachment:fixed found on: ${fixedAttachmentEls.join(", ")}`
            );
          }
          expect(fixedAttachmentEls, "background-attachment:fixed is broken on mobile Safari").toHaveLength(0);

          // Compare with desktop baseline
          const desktopStyles = desktopBaselines[route.name] ?? {};
          const diffs: string[] = [];

          for (const [selector, mobileProps] of Object.entries(mobileStyles)) {
            const desktopProps = desktopStyles[selector] ?? {};
            for (const [prop, mobileVal] of Object.entries(mobileProps)) {
              const desktopVal = desktopProps[prop] ?? "(no desktop baseline yet)";
              if (mobileVal !== desktopVal) {
                diffs.push(
                  `  ${selector} • ${prop}:\n    desktop: "${desktopVal}"\n    mobile:  "${mobileVal}"`
                );
              }
            }
          }

          if (diffs.length > 0) {
            console.log(
              `[BG DIFF] ${vp.name} vs desktop on "${route.name}":\n${diffs.join("\n")}`
            );
            // Differences are logged but not failed — some are intentional responsive design.
            // Fail only if body background-color changed unexpectedly.
            const desktopBodyBg = desktopStyles["body"]?.["background-color"] ?? "";
            const mobileBodyBg = mobileStyles["body"]?.["background-color"] ?? "";
            if (desktopBodyBg && mobileBodyBg && desktopBodyBg !== mobileBodyBg) {
              // Only fail for routes where we don't expect intentional overrides
              const photographyRoutes = ["photography"];
              if (!photographyRoutes.includes(route.name)) {
                expect(mobileBodyBg, `body background-color differs on ${route.name}`).toBe(desktopBodyBg);
              }
            }
          }

          await ctx.close();
        });
      }
    });
  }

  // ── 3. Reload tests (soft and hard) for every viewport × route ──────────────
  for (const vp of VIEWPORTS) {
    test.describe(`Reload tests — ${vp.name}`, () => {
      for (const route of ROUTES) {
        test(`Reload stability — ${vp.name} ${route.name}`, async ({ browser }) => {
          const ctx = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            isMobile: vp.isMobile,
            hasTouch: vp.isMobile,
          });
          const page = await ctx.newPage();

          // Initial load
          await gotoAndWait(page, `${BASE_URL}${route.path}`);
          const stylesBefore = await collectBgStyles(page);
          await screenshot(page, `${vp.name}_${route.name}_reload-before`);

          // ── Soft reload ────────────────────────────────────────────────────
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(600);
          const stylesAfterSoft = await collectBgStyles(page);
          await screenshot(page, `${vp.name}_${route.name}_reload-after-soft`);

          const softDrifts: string[] = [];
          for (const [sel, props] of Object.entries(stylesBefore)) {
            for (const [prop, before] of Object.entries(props)) {
              const after = stylesAfterSoft[sel]?.[prop] ?? "";
              if (before !== after) {
                softDrifts.push(`${sel} • ${prop}: "${before}" → "${after}"`);
              }
            }
          }
          if (softDrifts.length) {
            console.warn(
              `[SOFT RELOAD DRIFT] ${vp.name} ${route.name}:\n  ${softDrifts.join("\n  ")}`
            );
          }

          // ── Hard reload (cache-busted) ─────────────────────────────────────
          await page.evaluate(() => {
            // Trigger hard reload without caching
            const url = new URL(location.href);
            url.searchParams.set("_nocache", Date.now().toString());
            location.href = url.toString();
          });
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(600);
          const stylesAfterHard = await collectBgStyles(page);
          await screenshot(page, `${vp.name}_${route.name}_reload-after-hard`);

          const hardDrifts: string[] = [];
          for (const [sel, props] of Object.entries(stylesBefore)) {
            for (const [prop, before] of Object.entries(props)) {
              const after = stylesAfterHard[sel]?.[prop] ?? "";
              if (before !== after) {
                hardDrifts.push(`${sel} • ${prop}: "${before}" → "${after}"`);
              }
            }
          }
          if (hardDrifts.length) {
            console.warn(
              `[HARD RELOAD DRIFT] ${vp.name} ${route.name}:\n  ${hardDrifts.join("\n  ")}`
            );
          }

          // Assert: critical background properties must not change on any reload
          const criticalProps = ["background-color"];
          for (const prop of criticalProps) {
            const bodyBefore = stylesBefore["body"]?.[prop] ?? "";
            const bodyAfterSoft = stylesAfterSoft["body"]?.[prop] ?? "";
            const bodyAfterHard = stylesAfterHard["body"]?.[prop] ?? "";

            if (bodyBefore) {
              expect(
                bodyAfterSoft,
                `body ${prop} changed after soft reload on ${vp.name} ${route.name}`
              ).toBe(bodyBefore);

              // Hard reload may append ?_nocache param which doesn't change styles,
              // but we check anyway.
              expect(
                bodyAfterHard,
                `body ${prop} changed after hard reload on ${vp.name} ${route.name}`
              ).toBe(bodyBefore);
            }
          }

          await ctx.close();
        });
      }
    });
  }

  // ── 4. Dark mode flash check ─────────────────────────────────────────────────
  /**
   * Verify that dark mode preference is applied before first paint (no FOUC).
   * Simulates a user with prefers-color-scheme: dark.
   */
  test.describe("Dark mode FOUC detection", () => {
    for (const route of ROUTES) {
      test(`No dark mode FOUC — ${route.name}`, async ({ browser }) => {
        const ctx = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          colorScheme: "dark",
        });
        const page = await ctx.newPage();

        // Intercept first paint — check if .dark class is present on <html>
        // before any JS effects run (inject before navigation)
        const darkClassPresentBeforeHydration = await new Promise<boolean>(async (resolve) => {
          page.on("domcontentloaded", async () => {
            const hasDark = await page.evaluate(() =>
              document.documentElement.classList.contains("dark")
            );
            resolve(hasDark);
          });
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded" });
        });

        expect(
          darkClassPresentBeforeHydration,
          `Dark class missing on <html> at DOMContentLoaded for ${route.name} — risk of FOUC`
        ).toBe(true);

        // After full load: verify body background reflects dark mode
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(600);

        const styles = await collectBgStyles(page);
        const bodyBg = styles["body"]?.["background-color"] ?? "";
        await screenshot(page, `dark-fouc-check_${route.name}`);

        // In dark mode, body should NOT be white (#ffffff)
        // (it should be the dark color #1a1a1a or the photo bg #050507)
        expect(
          bodyBg,
          `body background-color is still light (#ffffff) in dark mode for ${route.name}`
        ).not.toBe("rgb(255, 255, 255)");

        await ctx.close();
      });
    }
  });

  // ── 5. useIsDark hydration flash check ───────────────────────────────────────
  /**
   * The useIsDark() hook initializes to `false`, meaning components that use it
   * (PhotographyBackground, PhotoSide, CSSide, PhotographyLayout) briefly render
   * in light mode even if the system is dark. This test catches that 1-frame flash.
   */
  test("useIsDark hydration — photography page light flash in dark mode", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      colorScheme: "dark",
    });
    const page = await ctx.newPage();

    // Intercept immediately after DOMContentLoaded, before useEffect fires
    let bgAtDomReady = "";
    page.on("domcontentloaded", async () => {
      // Small delay to let initial render happen but not effects
      await page.waitForTimeout(50);
      bgAtDomReady = await page.evaluate(() =>
        getComputedStyle(document.body).backgroundColor
      );
    });

    await page.goto(`${BASE_URL}/photography`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const bgFinal = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );

    console.log(`[useIsDark check] body bg at DOMReady: "${bgAtDomReady}", final: "${bgFinal}"`);

    // If bgAtDomReady was white/light and bgFinal is dark, that's a flash
    const wasLight = bgAtDomReady === "rgb(255, 255, 255)" || bgAtDomReady === "rgb(248, 245, 240)";
    const isDarkFinal = bgFinal === "rgb(5, 5, 7)" || bgFinal === "rgb(26, 26, 26)";

    if (wasLight && isDarkFinal) {
      console.warn(
        "[FOUC BUG] useIsDark() initialized to false caused a light→dark flash on /photography"
      );
    }

    await screenshot(page, "useIsDark-hydration-flash-check");
    await ctx.close();
  });

  // ── 6. 100vh vs 100dvh inconsistency on mobile ───────────────────────────────
  /**
   * Photography layout uses minHeight: 100vh (old unit).
   * On mobile Safari the address bar causes 100vh > visible viewport height.
   * Check whether content overflows or is clipped.
   */
  test("100vh overflow check on mobile — photography layout", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();

    await gotoAndWait(page, `${BASE_URL}/photography`);

    const { documentHeight, viewportHeight, windowInnerHeight } = await page.evaluate(() => ({
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: document.documentElement.clientHeight,
      windowInnerHeight: window.innerHeight,
    }));

    console.log(
      `[vh check] document.scrollHeight=${documentHeight}, clientHeight=${viewportHeight}, innerHeight=${windowInnerHeight}`
    );

    // If documentHeight > viewportHeight + some threshold, minHeight:100vh
    // may be forcing a scroll on what should be a fixed-background screen.
    if (documentHeight > viewportHeight + 50) {
      console.warn(
        `[100vh ISSUE] /photography document is ${documentHeight - viewportHeight}px taller than viewport — ` +
        `minHeight:100vh may be causing unwanted scroll on mobile`
      );
    }

    await screenshot(page, "100vh-overflow-check");
    await ctx.close();
  });

  // ── 7. isMobile hydration shift — home page ───────────────────────────────────
  /**
   * app/page.tsx uses useState(false) for isMobile, then corrects it in useEffect.
   * On mobile, this causes the home page to render in row (desktop) layout first,
   * then snap to column layout — visible as a flash.
   */
  test("Home page isMobile hydration shift", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();

    let flexDirectionAtMount = "";
    page.on("domcontentloaded", async () => {
      await page.waitForTimeout(30); // after first render, before useEffect
      flexDirectionAtMount = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('[style*="fixed"]');
        return el ? getComputedStyle(el).flexDirection : "not-found";
      });
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const flexDirectionFinal = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[style*="fixed"]');
      return el ? getComputedStyle(el).flexDirection : "not-found";
    });

    console.log(
      `[isMobile shift] flex-direction at mount: "${flexDirectionAtMount}", final: "${flexDirectionFinal}"`
    );

    if (flexDirectionAtMount === "row" && flexDirectionFinal === "column") {
      console.warn(
        "[HYDRATION BUG] Home page rendered row layout first then snapped to column on mobile — " +
        "user sees a layout flash. Fix: initialize isMobile from a server-safe value or use CSS."
      );
    }

    await screenshot(page, "home-mobile-hydration-shift");
    await ctx.close();
  });
});

// ─── Summary reporter ──────────────────────────────────────────────────────────

test.afterAll(() => {
  console.log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}\n`);
  console.log("Run: open tests/screenshots/ to view results\n");
});
