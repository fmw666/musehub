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
// - `total-js` / `total-css`: overall production payload ceiling.
//
// Thresholds are gzip kilobytes. Update deliberately with a commit that
// explains the new cost.
const BUDGETS = {
  "main-js": 95, // main entry js (currently ~77 KB gzip)
  "main-css": 55, // main entry css (currently ~45 KB gzip)
  "lazy-js": 40, // biggest lazy page js chunk (currently ~29 KB)
  "lazy-css": 8, // biggest lazy page css chunk (currently ~4 KB)
  "total-js": 170, // sum of all JS (currently ~126 KB)
  "total-css": 60, // sum of all CSS (currently ~51 KB)
};

const MAIN_HINTS = /(^|\/)index-[A-Za-z0-9_-]+\.(js|css)$/;
const LAZY_PAGE_HINT = /(Page|Route)-[A-Za-z0-9_-]+\.(js|css)$/;

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

  results[ext].push({ file, gzipKB, isMain: MAIN_HINTS.test(file), isLazyPage: LAZY_PAGE_HINT.test(file) });
}

const violations = [];
const headline = [];

for (const kind of ["js", "css"]) {
  const items = results[kind].sort((a, b) => b.gzipKB - a.gzipKB);
  const main = items.find((item) => item.isMain);
  const lazy = items.filter((item) => item.isLazyPage);
  const total = items.reduce((sum, item) => sum + item.gzipKB, 0);

  const mainBudget = BUDGETS[`main-${kind}`];
  const lazyBudget = BUDGETS[`lazy-${kind}`];
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
    const tag = item.isMain ? "main" : item.isLazyPage ? "page" : "chunk";
    console.log(`    ${tag.padEnd(5)} ${item.gzipKB.toString().padStart(7)} KB  ${item.file}`);
  }
}

if (violations.length) {
  console.error("\n[perf-guard] budget exceeded:");
  for (const v of violations) console.error("  - " + v);
  console.error(
    "\nReview whether the regression is intentional. If yes, update BUDGETS in scripts/perf-guard.mjs in the same commit.",
  );
  process.exit(1);
}

console.log("\n[perf-guard] ok");
