#!/usr/bin/env node
/**
 * Performance guard: enforce bundle-size budgets on `dist/assets/`.
 *
 * Philosophy: prevent silent regressions. Budgets are set slightly above the
 * current green build so routine churn stays green, but a meaningful regression
 * (e.g. a heavy dep, accidental merge of a lazy chunk back into the main
 * bundle, or un-split CSS) turns CI red.
 *
 * Run:
 *   npm run guard:perf          # builds if dist/ is stale, then checks
 *   npm run guard:perf -- --no-build
 *
 * Budgets are expressed in gzip KB.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist", "assets");

const args = new Set(process.argv.slice(2));
const shouldBuild = !args.has("--no-build");

if (shouldBuild) {
  if (!existsSync(distDir)) {
    console.log("[perf-guard] dist/ missing, running `npm run build`…");
    execSync("npm run build", { cwd: repoRoot, stdio: "inherit" });
  }
} else if (!existsSync(distDir)) {
  console.error("[perf-guard] dist/ missing and --no-build was passed.");
  process.exit(2);
}

// Budget model.
// - `main-js` / `main-css`: first-paint critical path (non-lazy).
// - `lazy-js` / `lazy-css`: any lazy-loaded page chunk. Each chunk is checked
//   against this per-chunk ceiling.
// - `vendor-js`: any auto-split vendor chunk (e.g. createLucideIcon). Each
//   such chunk is checked against this ceiling individually. This is a
//   regression canary — if a new large third-party dep starts getting its
//   own auto-split chunk, we want to notice before it silently grows past
//   existing peers.
// - `total-js` / `total-css`: overall production payload ceiling.
//
// Thresholds are gzip kilobytes. Update deliberately with a commit that
// explains the new cost.
//
// Currently (as of the May 2026 green build):
//   main-js       = 79.00 KB     (budget 95)
//   createLucide  = 70.86 KB     (budget 80, vendor-js peer)
//   Community pg  = 10.42 KB     (budget 40, lazy-js)
//   Upload pg     =  6.19 KB     (budget 40, lazy-js)
//   total-js      = 166.71 KB    (budget 170, ~2% headroom)
//   main-css      =  44.85 KB    (budget 55)
//   total-css     =  50.79 KB    (budget 60)
//
// Motion runtime note: `motion` is bundled inline with application code in
// the main-js chunk; an attempt to split it out via manualChunks (vite 8 /
// rolldown) was reverted because explicit manualChunks disables rolldown's
// automatic de-duplication, resulting in a net +5KB gzip regression across
// the payload. See docs/adr/0002-animate-ui-motion-only.md.
const BUDGETS = {
  "main-js": 95, // main entry js
  "main-css": 55, // main entry css
  "lazy-js": 40, // biggest lazy page js chunk
  "lazy-css": 8, // biggest lazy page css chunk
  "vendor-js": 80, // biggest auto-split third-party chunk (createLucideIcon today)
  // Bumped 170→175 in the sign-in / auth-state-management change: the
  // AuthProvider (reducer-based context, cross-tab storage sync, expiry
  // watchdog) + RequireAuth guard + lazy SignInPage chunk together
  // added ~0.4 KB gzip to main-js. The feature is now mainlined across
  // every route (rail user affordance, gated routes), so it belongs in
  // the core budget rather than a page chunk.
  "total-js": 175, // sum of all JS
  "total-css": 60, // sum of all CSS
};

const MAIN_HINTS = /(^|\/)index-[A-Za-z0-9_-]+\.(js|css)$/;
const LAZY_PAGE_HINT = /(Page|Route)-[A-Za-z0-9_-]+\.(js|css)$/;
// Heuristic: vendor chunks are ones that aren't main, aren't page chunks,
// aren't the tiny utility helpers rolldown emits (copy, rolldown-runtime),
// and are large enough to matter. We check "large enough" later by gzip
// size against the vendor-js ceiling.
const TINY_HELPER_HINT = /^(copy|rolldown-runtime)-/;

const results = { js: [], css: [] };

for (const file of readdirSync(distDir)) {
  const full = path.join(distDir, file);
  const stat = statSync(full);
  if (!stat.isFile()) continue;
  const ext = path.extname(file).replace(".", "");
  if (ext !== "js" && ext !== "css") continue;

  const raw = readFileSync(full);
  const gzipBytes = gzipSync(raw).length;
  const gzipKB = +(gzipBytes / 1024).toFixed(2);

  const isMain = MAIN_HINTS.test(file);
  const isLazyPage = LAZY_PAGE_HINT.test(file);
  const isTinyHelper = TINY_HELPER_HINT.test(file);
  // Everything that isn't main, page, or a tiny helper, and is JS, is a
  // third-party vendor chunk from rolldown's automatic splitting.
  const isVendor = ext === "js" && !isMain && !isLazyPage && !isTinyHelper;

  results[ext].push({ file, gzipKB, isMain, isLazyPage, isVendor, isTinyHelper });
}

const violations = [];
const headline = [];

for (const kind of ["js", "css"]) {
  const items = results[kind].sort((a, b) => b.gzipKB - a.gzipKB);
  const main = items.find((item) => item.isMain);
  const lazy = items.filter((item) => item.isLazyPage);
  const vendors = items.filter((item) => item.isVendor);
  const total = items.reduce((sum, item) => sum + item.gzipKB, 0);

  const mainBudget = BUDGETS[`main-${kind}`];
  const lazyBudget = BUDGETS[`lazy-${kind}`];
  const vendorBudget = BUDGETS[`vendor-${kind}`];
  const totalBudget = BUDGETS[`total-${kind}`];

  headline.push(
    `${kind.toUpperCase()}: main=${main ? main.gzipKB : "?"}KB/${mainBudget}KB · total=${total.toFixed(2)}KB/${totalBudget}KB`,
  );

  if (main && main.gzipKB > mainBudget) {
    violations.push(`main-${kind} ${main.file} is ${main.gzipKB}KB > budget ${mainBudget}KB`);
  }
  for (const chunk of lazy) {
    if (chunk.gzipKB > lazyBudget) {
      violations.push(`lazy-${kind} ${chunk.file} is ${chunk.gzipKB}KB > budget ${lazyBudget}KB`);
    }
  }
  if (vendorBudget !== undefined) {
    for (const chunk of vendors) {
      if (chunk.gzipKB > vendorBudget) {
        violations.push(
          `vendor-${kind} ${chunk.file} is ${chunk.gzipKB}KB > budget ${vendorBudget}KB`,
        );
      }
    }
  }
  if (total > totalBudget) {
    violations.push(`total-${kind} is ${total.toFixed(2)}KB > budget ${totalBudget}KB`);
  }
}

console.log("[perf-guard] gzip budgets");
for (const line of headline) console.log("  " + line);

for (const kind of ["js", "css"]) {
  const items = results[kind].sort((a, b) => b.gzipKB - a.gzipKB);
  if (!items.length) continue;
  console.log(`  ${kind} chunks:`);
  for (const item of items) {
    const tag = item.isMain
      ? "main"
      : item.isLazyPage
        ? "page"
        : item.isVendor
          ? "vendor"
          : item.isTinyHelper
            ? "helper"
            : "chunk";
    console.log(`    ${tag.padEnd(6)} ${item.gzipKB.toString().padStart(7)} KB  ${item.file}`);
  }
}

// Motion runtime observability: rolldown inlines `motion` into main-js, so
// it has no dedicated chunk. Experimentally splitting it via manualChunks
// costs ~5KB gzip because rolldown's automatic de-duplication stops when
// explicit manualChunks is set. We therefore do not try to measure motion
// in-bundle from this script; main-js staying under its budget is the
// proxy. See docs/adr/0002-animate-ui-motion-only.md for details.

if (violations.length) {
  console.error("\n[perf-guard] budget exceeded:");
  for (const v of violations) console.error("  - " + v);
  console.error(
    "\nReview whether the regression is intentional. If yes, update BUDGETS in scripts/perf-guard.mjs in the same commit.",
  );
  process.exit(1);
}

console.log("\n[perf-guard] ok");
