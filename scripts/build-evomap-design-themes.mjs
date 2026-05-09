// Builds the `evomap-design-themes` community showcase from the upstream
// snapshot at `vendor/evomap-design-themes-source/` into the flat layout
// the MuseHub showcase contract expects:
//
//   public/community-showcases/evomap-design-themes/
//     ├── index.html      (CSP-pinned shell, links sibling .css/.js only)
//     ├── styles.css      (concat of every upstream stylesheet, in order)
//     ├── script.js       (bundled main.js + relative deps + three.js)
//     ├── logo-mask.png   (Canvas2D fallback texture, kept as-is)
//     └── metadata.json   (id, title, tags, sha256+bytes per file)
//
// Plus the matching downloadable bundle at
// `public/community-zips/evomap-design-themes.zip`.
//
// Why a build step: the upstream lives under `design_online/` with
// nested `src/` and `styles/` directories, imports `three` from a CDN,
// and ships ~16 individual files — none of which are allowed by
// `scripts/validate-community-showcases.mjs` (max 10 flat siblings, no
// remote imports, single-level layout). Rather than fork the upstream
// into the flat layout by hand and lose the ability to re-pull, we
// bundle on demand and keep the upstream snapshot in `vendor/` for
// reproducibility.

import { rolldown } from "rolldown";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceRoot = path.join(root, "vendor", "evomap-design-themes-source");
const showcaseId = "evomap-design-themes";
const showcaseRoot = path.join(root, "public", "community-showcases", showcaseId);
const zipPath = path.join(root, "public", "community-zips", `${showcaseId}.zip`);

const remoteThreeImportPattern = /https:\/\/esm\.sh\/three@\d+\.\d+\.\d+/g;

const cspContent = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join("; ");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readSourceText(relativePath) {
  return readFile(path.join(sourceRoot, relativePath), "utf8");
}

/**
 * Concat the upstream stylesheets in the order their @import line
 * appears in `styles/index.css`. We deliberately rebuild the import
 * graph by hand instead of running CSS through a bundler — every entry
 * is a single relative @import, no nesting, so a string concat preserves
 * the cascade exactly.
 */
async function buildStylesheet() {
  const indexCss = await readSourceText("styles/index.css");
  const importRe = /@import\s+["']\.\/([\w./-]+)["'];?/g;
  const filenames = [...indexCss.matchAll(importRe)].map((match) => match[1]);
  if (filenames.length === 0) {
    throw new Error("styles/index.css contained no @import entries");
  }

  const chunks = [];
  chunks.push("/*\n");
  chunks.push(" * Bundled stylesheet for the MuseHub `evomap-design-themes` showcase.\n");
  chunks.push(" * Concatenated from the upstream `styles/*.css` files in @import order.\n");
  chunks.push(" * Source: vendor/evomap-design-themes-source/styles/\n");
  chunks.push(" */\n\n");

  for (const filename of filenames) {
    const css = await readSourceText(`styles/${filename}`);
    chunks.push(`/* ── ${filename} ── */\n`);
    chunks.push(css.trim());
    chunks.push("\n\n");
  }

  return chunks.join("");
}

/**
 * Walk every `.js` file under `dir` and rewrite `import ... from "./x?v=N"`
 * style cache-busters to the bare path. The upstream uses these
 * extensively (e.g. `./createCellularHero.js?v=2`) so the browser can
 * invalidate stale module caches between revisions, but rolldown's
 * resolver treats the query string as part of the filename and fails
 * with `Could not load .../createCellularHero.js?v=2 — No such file`.
 * Stripping them only mutates the staged copy.
 */
async function stripImportQueryStrings(dir) {
  const importQueryPattern = /(from\s+["'])(\.[^"']+?)(\?[^"']*)(["'])/g;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await stripImportQueryStrings(entryPath);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;
    const original = await readFile(entryPath, "utf8");
    const stripped = original.replace(importQueryPattern, "$1$2$4");
    if (stripped !== original) {
      await writeFile(entryPath, stripped);
    }
  }
}

async function buildScript() {
  const stagingDir = await mkdtemp(path.join(tmpdir(), "evomap-themes-stage-"));
  try {
    await cp(sourceRoot, stagingDir, { recursive: true });

    const heroEntryPath = path.join(stagingDir, "src", "hero", "createHero.js");
    const original = await readFile(heroEntryPath, "utf8");
    if (!remoteThreeImportPattern.test(original)) {
      throw new Error(
        `Expected ${heroEntryPath} to import three.js from esm.sh; ` +
          "the source may have been updated. Refresh this build script.",
      );
    }
    remoteThreeImportPattern.lastIndex = 0;
    const patched = original.replace(remoteThreeImportPattern, "three");
    await writeFile(heroEntryPath, patched);

    await stripImportQueryStrings(path.join(stagingDir, "src"));

    const bundle = await rolldown({
      input: path.join(stagingDir, "src", "main.js"),
      resolve: {
        alias: {
          three: path.join(root, "node_modules", "three", "build", "three.module.min.js"),
        },
      },
      // The upstream uses cache-busting `?v=N` query strings on
      // sibling imports (e.g. `./hero/createHero.js?v=2`). Rolldown
      // resolves those to the same module identity once stripped,
      // but emit at most one warning per case.
      onwarn(warning, defaultHandler) {
        if (warning.code === "UNRESOLVED_IMPORT") {
          defaultHandler(warning);
          return;
        }
        if (warning.code === "CIRCULAR_DEPENDENCY") {
          return;
        }
        defaultHandler(warning);
      },
    });

    const { output } = await bundle.generate({
      format: "iife",
      // Single-chunk output; the upstream has no real code-splitting,
      // and the showcase contract caps total file count at 10 flat
      // siblings — anything that fans out into chunks is rejected.
      codeSplitting: false,
    });
    await bundle.close();

    const chunks = output.filter((chunk) => chunk.type === "chunk");
    if (chunks.length !== 1) {
      throw new Error(
        `Expected a single bundled chunk, got ${chunks.length} (${chunks
          .map((chunk) => chunk.fileName)
          .join(", ")}). Check inlineDynamicImports.`,
      );
    }

    const banner =
      "/*\n" +
      " * Bundled hero engine for the MuseHub `evomap-design-themes` showcase.\n" +
      " * Compiled from the upstream src/main.js entry plus relative deps and\n" +
      " * the locally-vendored three.js build (no remote imports remain).\n" +
      " * Source: vendor/evomap-design-themes-source/src/\n" +
      " */\n\n";

    return banner + chunks[0].code;
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}

/**
 * Rewrite the upstream `index.html` to match the showcase contract:
 *  - inject the strict CSP meta tag,
 *  - swap the `./styles/index.css?v=N` link for a flat `./styles.css`,
 *  - swap the `./src/main.js?v=N` script for a flat `./script.js`,
 *  - drop the upstream cache-busting query strings.
 */
function rewriteIndexHtml(html) {
  let next = html;

  if (!/Content-Security-Policy/i.test(next)) {
    next = next.replace(
      /<meta\s+name="viewport"[^>]*\/?>/i,
      (match) =>
        `${match}\n        <meta http-equiv="Content-Security-Policy" content="${cspContent}" />`,
    );
  }

  next = next.replace(
    /<link\s+rel="stylesheet"\s+href="\.\/styles\/index\.css(?:\?[^"]*)?"\s*\/?>/i,
    '<link rel="stylesheet" href="./styles.css" />',
  );

  next = next.replace(
    /<script\s+type="module"\s+src="\.\/src\/main\.js(?:\?[^"]*)?"\s*><\/script>/i,
    '<script type="module" src="./script.js"></script>',
  );

  return next;
}

async function buildMetadataFiles(fileBuffers, indexHtmlSize) {
  const files = {};
  for (const [name, buffer] of fileBuffers.entries()) {
    files[name] = {
      sha256: sha256(buffer),
      bytes: buffer.byteLength,
    };
  }
  void indexHtmlSize;
  return files;
}

async function ensureCleanShowcase() {
  if (existsSync(showcaseRoot)) {
    await rm(showcaseRoot, { recursive: true, force: true });
  }
  await mkdir(showcaseRoot, { recursive: true });
}

async function buildZip() {
  await mkdir(path.dirname(zipPath), { recursive: true });
  if (existsSync(zipPath)) {
    await rm(zipPath);
  }

  const entries = (await readdir(showcaseRoot)).sort();
  execFileSync("zip", ["-q", "-X", zipPath, ...entries], { cwd: showcaseRoot });

  const zipStat = await stat(zipPath);
  return zipStat.size;
}

async function main() {
  if (!existsSync(sourceRoot)) {
    throw new Error(`Upstream source missing at ${sourceRoot}`);
  }

  const [stylesheet, script] = await Promise.all([buildStylesheet(), buildScript()]);
  const indexHtml = rewriteIndexHtml(await readSourceText("index.html"));
  const logoMaskBuffer = await readFile(path.join(sourceRoot, "assets", "logo-mask.png"));

  await ensureCleanShowcase();

  const indexHtmlBuffer = Buffer.from(indexHtml, "utf8");
  const stylesBuffer = Buffer.from(stylesheet, "utf8");
  const scriptBuffer = Buffer.from(script, "utf8");

  const fileBuffers = new Map([
    ["index.html", indexHtmlBuffer],
    ["styles.css", stylesBuffer],
    ["script.js", scriptBuffer],
    ["logo-mask.png", logoMaskBuffer],
  ]);

  for (const [name, buffer] of fileBuffers.entries()) {
    await writeFile(path.join(showcaseRoot, name), buffer);
  }

  const filesIntegrity = await buildMetadataFiles(fileBuffers, indexHtmlBuffer.byteLength);

  const metadata = {
    id: showcaseId,
    title: "EvoMap Hero Themes — Halftone Field Variants",
    tags: ["webgl", "halftone", "hero", "theme", "shader", "fluid", "three-js"],
    sourceUrl: "https://github.com/evomap/evomap-design-dashboard",
    sourcePlatform: "github",
    originalFile: "design_online/",
    assetPath: `/community-showcases/${showcaseId}/index.html`,
    importedAt: new Date().toISOString().slice(0, 10),
    environment: "vanilla",
    preview: {
      width: 1440,
      height: 900,
      displayWidth: 1080,
    },
    assets: {
      html: "index.html",
      styles: ["styles.css"],
      scripts: ["script.js"],
      media: ["logo-mask.png"],
    },
    downloads: [
      {
        kind: "vanilla",
        label: "Vanilla static (zip)",
        url: `/community-zips/${showcaseId}.zip`,
        description:
          "Self-contained static bundle with bundled three.js, halftone + cellular engines, and 8 curated theme variants.",
      },
    ],
    files: filesIntegrity,
  };

  await writeFile(
    path.join(showcaseRoot, "metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );

  const zipSize = await buildZip();

  const summary = [
    `Wrote ${showcaseRoot}:`,
    ...fileBuffers.keys(),
    "metadata.json",
    "",
    `Wrote ${zipPath} (${(zipSize / 1024).toFixed(1)} KB).`,
  ].join("\n");

  console.log(summary);
}

await main().catch((error) => {
  console.error(error);
  process.exit(1);
});
