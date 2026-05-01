#!/usr/bin/env node
/**
 * MuseHub design-system guard.
 *
 * Enforces the rules in `.cursor/rules/muse-design-system.mdc`:
 *   1. No hardcoded hex / rgb / rgba / oklch colors in feature CSS
 *      (tokens only, short list of explicit exceptions).
 *   2. Every --muse- / --action- / --hk- / --upload- token referenced in
 *      feature CSS must be declared somewhere under src/styles/
 *      (theme.css or a feature sheet).
 *   3. No inline cubic-bezier(...) in feature CSS; use --muse-ease-*.
 *   4. @keyframes names must be unique across CSS under src/styles.
 *   5. Animate UI is motion-only (see ADR 0002 and
 *      `.cursor/rules/heroui-v3-components.mdc`):
 *      - `motion` / `motion/react` may only be imported from
 *        `src/shared/ui/motion/**` or `src/shared/ui/icons/animated/**`.
 *
 * Usage:
 *   npm run guard:design
 *   npm run guard:design -- --quiet
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const stylesRoot = path.join(repoRoot, "src", "styles");
const srcRoot = path.join(repoRoot, "src");

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_RE = /\brgba?\(\s*\d/g;
const OKLCH_RE = /\boklch\(/g;
const CUBIC_RE = /\bcubic-bezier\(/g;
const VAR_REF_RE = /var\(\s*(--(?:muse|action|hk|upload)-[a-z0-9-]+)/gi;
const VAR_DECL_RE = /(--(?:muse|action|hk|upload)-[a-z0-9-]+)\s*:/gi;
const KEYFRAMES_RE = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g;
// Matches `from "motion"` or `from "motion/react"` (and single-quote variants),
// plus `import("motion...")` and `require("motion...")` just in case.
const MOTION_IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]motion(?:\/[^'"]+)?['"]/g;

// Hardcoded color values that are allowed anywhere (kept intentionally tiny).
const COLOR_ALLOWLIST = new Set(["#000", "#fff", "#111", "#15140f", "transparent", "currentcolor"]);

// Files that are allowed to hold raw palette literals — the token definition itself.
const TOKEN_SOURCE_FILES = new Set([
  path.join(stylesRoot, "theme.css"),
  path.join(stylesRoot, "index.css"),
]);

// Vendor / ported-artwork surfaces keep their upstream palette and easing verbatim
// so we can diff them against the original showcase. They are exempt from the
// MuseHub token rules, but must still opt in via a comment header declaring why.
const VENDOR_PATH_FRAGMENTS = [path.join("shared", "ui", "agent-mascot")];

// Community-showcase vendor CSS is user-submitted artwork, not MuseHub surface.
const IGNORE_PATH_FRAGMENTS = [
  path.join("public", "community-showcases"),
  path.join("node_modules"),
  path.join("dist"),
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      walk(full, out);
    } else if (s.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function shouldIgnore(file) {
  return IGNORE_PATH_FRAGMENTS.some((frag) => file.includes(frag));
}

function isVendor(file) {
  return VENDOR_PATH_FRAGMENTS.some((frag) => file.includes(frag));
}

function rel(file) {
  return path.relative(repoRoot, file).replace(/\\/g, "/");
}

// --- 0. collect files ---------------------------------------------------
const allFiles = walk(srcRoot).filter((f) => !shouldIgnore(f));
const cssFiles = allFiles.filter((f) => f.endsWith(".css"));
const tsFiles = allFiles.filter((f) => /\.(?:ts|tsx|mts|cts)$/.test(f));

// Paths that may legitimately import Animate UI / motion effects.
// See ADR 0002.
const MOTION_ALLOWED_PATH_FRAGMENTS = [
  path.join("src", "shared", "ui", "motion"),
  path.join("src", "shared", "ui", "icons", "animated"),
  // Test helpers that stub motion hooks for reduced-motion branch coverage.
  path.join("src", "test"),
];

function isMotionAllowedPath(file) {
  return MOTION_ALLOWED_PATH_FRAGMENTS.some((frag) => file.includes(frag));
}

const offences = [];

function report(kind, file, detail) {
  offences.push({ kind, file: rel(file), detail });
}

// --- 1. scan token declarations (across ALL css under src/styles) -------
const declaredTokens = new Set();
for (const file of cssFiles) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(VAR_DECL_RE)) {
    declaredTokens.add(m[1]);
  }
}

// --- 2. scan each css file for violations -------------------------------
const seenKeyframes = new Map(); // name -> first file

for (const file of cssFiles) {
  const src = readFileSync(file, "utf8");
  const isTokenSource = TOKEN_SOURCE_FILES.has(file);
  const vendor = isVendor(file);

  // Vendor-ported artwork (agent mascots, etc.) keeps upstream literals for
  // 1:1 parity. We only require a header comment declaring the source.
  if (vendor) {
    const first200 = src.slice(0, 400).toLowerCase();
    const hasVendorHeader =
      first200.includes("port") || first200.includes("vendor") || first200.includes("showcase");
    if (!hasVendorHeader) {
      report(
        "vendor-missing-header",
        file,
        "add a top comment declaring the upstream source (e.g. '... port of the ... showcase').",
      );
    }
    // Still check keyframes uniqueness for vendor files (global scope matters).
    for (const m of src.matchAll(KEYFRAMES_RE)) {
      const name = m[1];
      if (seenKeyframes.has(name) && seenKeyframes.get(name) !== file) {
        report("duplicate-keyframes", file, `${name} (also in ${rel(seenKeyframes.get(name))})`);
      } else if (!seenKeyframes.has(name)) {
        seenKeyframes.set(name, file);
      }
    }
    continue;
  }

  // 2a. hardcoded colors
  if (!isTokenSource) {
    for (const m of src.matchAll(HEX_RE)) {
      const lit = m[0].toLowerCase();
      if (COLOR_ALLOWLIST.has(lit)) continue;
      report("hardcoded-hex", file, lit);
    }
    for (const m of src.matchAll(RGB_RE)) {
      // Allow `rgb(var(--muse-color-X-rgb) / 0.NN)` — that form starts with `rgb(var(`, not `rgb(<digit>`.
      report("hardcoded-rgb", file, m[0].trim());
    }
    for (const _ of src.matchAll(OKLCH_RE)) {
      report("hardcoded-oklch", file, "oklch(...)");
    }
    for (const _ of src.matchAll(CUBIC_RE)) {
      report("inline-cubic-bezier", file, "cubic-bezier(...) — use --muse-ease-*");
    }
  }

  // 2b. undeclared token references
  for (const m of src.matchAll(VAR_REF_RE)) {
    const name = m[1];
    if (!declaredTokens.has(name)) {
      report("undeclared-token", file, name);
    }
  }

  // 2c. keyframes uniqueness
  for (const m of src.matchAll(KEYFRAMES_RE)) {
    const name = m[1];
    if (seenKeyframes.has(name) && seenKeyframes.get(name) !== file) {
      report("duplicate-keyframes", file, `${name} (also in ${rel(seenKeyframes.get(name))})`);
    } else if (!seenKeyframes.has(name)) {
      seenKeyframes.set(name, file);
    }
  }
}

// --- 3. scan TS/TSX for out-of-scope motion imports ---------------------
for (const file of tsFiles) {
  if (isMotionAllowedPath(file)) continue;
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(MOTION_IMPORT_RE)) {
    report(
      "motion-outside-scope",
      file,
      `${m[0].trim()} — motion imports are allowed only in src/shared/ui/motion/** or src/shared/ui/icons/animated/** (see ADR 0002).`,
    );
  }
}

// --- 4. report ----------------------------------------------------------
const quiet = process.argv.includes("--quiet");

if (offences.length === 0) {
  if (!quiet) {
    process.stdout.write(
      "\n✓ design-guard: CSS is clean (tokens only, no raw colors, easings via --muse-ease-*, unique keyframes).\n",
    );
  }
  process.exit(0);
}

const byKind = new Map();
for (const o of offences) {
  if (!byKind.has(o.kind)) byKind.set(o.kind, []);
  byKind.get(o.kind).push(o);
}

process.stdout.write("\n✗ design-guard: violations found\n");
for (const [kind, list] of byKind) {
  process.stdout.write(`\n  [${kind}] ${list.length}\n`);
  for (const o of list.slice(0, 40)) {
    process.stdout.write(`    ${o.file}  —  ${o.detail}\n`);
  }
  if (list.length > 40) {
    process.stdout.write(`    … and ${list.length - 40} more\n`);
  }
}

process.stdout.write(
  "\n  Fix guidance: see .cursor/rules/muse-design-system.mdc\n" +
    "  - Map raw hex/rgb to a --muse-color-*-rgb palette token and consume via rgb(var(--muse-color-X-rgb) / 0.NN).\n" +
    "  - Replace cubic-bezier(...) with var(--muse-ease-emerge) or var(--muse-ease-dissolve).\n" +
    "  - Declare missing tokens in src/styles/theme.css or scope component tokens with --feature-* in the feature sheet.\n" +
    "  - Rename duplicate @keyframes using a feature prefix (e.g. upload-*, community-*).\n" +
    "  - Move `motion` / `motion/react` imports into src/shared/ui/motion/** or src/shared/ui/icons/animated/** (see ADR 0002); consumers should use the motion atoms exported from there.\n\n",
);

process.exit(1);
