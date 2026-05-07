import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve("public/community-showcases");
const requiredCoreFiles = ["index.html", "metadata.json"];
const stylesheetExtensions = new Set([".css"]);
const scriptExtensions = new Set([".js", ".mjs"]);
const videoExtensions = new Set([".mp4", ".webm"]);
const imageExtensions = new Set([".png", ".webp", ".avif", ".svg", ".jpg", ".jpeg"]);
const mediaExtensions = new Set([...videoExtensions, ...imageExtensions]);
const allowedAssetExtensions = new Set([
  ...stylesheetExtensions,
  ...scriptExtensions,
  ...mediaExtensions,
]);
const svgExtension = ".svg";
const maxFileCount = 10;
const maxFileBytes = 5 * 1024 * 1024;
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const tagPattern = /^[a-z0-9][a-z0-9-]{0,31}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const filenamePattern = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?\.[a-z0-9]+$/i;
const knownEnvironments = new Set(["vanilla", "react", "vue", "svelte", "solid", "angular"]);
const downloadUrlPattern = /^\/community-zips\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?\.zip$/;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const htmlBlocklist = [
  { pattern: /<style\b/i, message: "inline style tag" },
  { pattern: /\son[a-z]+\s*=/i, message: "inline event handler attribute" },
  { pattern: /\sstyle\s*=/i, message: "inline style attribute" },
  { pattern: /\ssrcdoc\s*=/i, message: "srcdoc attribute" },
  {
    pattern: /\b(?:href|src)\s*=\s*["'](?:javascript:|data:text\/html)/i,
    message: "scriptable URL",
  },
  { pattern: /https?:\/\//i, message: "remote URL in HTML shell" },
  { pattern: /<iframe\b|<object\b|<embed\b|<form\b|<base\b/i, message: "high-risk HTML element" },
  { pattern: /http-equiv\s*=\s*["']refresh["']/i, message: "meta refresh" },
];

const cssBlocklist = [
  { pattern: /@import\s+(?:url\()?["']?https?:/i, message: "remote CSS import" },
  { pattern: /url\(\s*["']?javascript:/i, message: "javascript URL in CSS" },
  { pattern: /expression\s*\(/i, message: "CSS expression" },
  { pattern: /-moz-binding\s*:/i, message: "XBL binding" },
  { pattern: /\bbehavior\s*:/i, message: "legacy behavior binding" },
];

/*
 * SVG is XML and can host scripts, inline event handlers, foreign HTML, and
 * scriptable URLs. Browsers don't run scripts when SVG is loaded as an `<img>`
 * source, but they do when the SVG is opened directly or embedded via
 * `<object>`. Scan every shipped .svg file for the actual XSS vectors. We do
 * not block plain `http(s)://` strings here because SVG `xmlns` attributes
 * (e.g. `http://www.w3.org/2000/svg`) are namespace identifiers, not network
 * fetches; the showcase CSP already pins runtime loads to the same origin.
 */
const svgBlocklist = [
  { pattern: /<script\b/i, message: "script element in SVG" },
  { pattern: /\son[a-z]+\s*=/i, message: "inline event handler in SVG" },
  { pattern: /<foreignObject\b/i, message: "foreignObject in SVG" },
  {
    pattern: /\b(?:href|xlink:href|src)\s*=\s*["']\s*(?:javascript:|data:text\/html)/i,
    message: "scriptable URL in SVG",
  },
  {
    pattern: /\b(?:href|xlink:href|src)\s*=\s*["']\s*https?:\/\//i,
    message: "remote URL in SVG",
  },
];

const jsBlocklist = [
  { pattern: /\beval\s*\(/, message: "eval()" },
  { pattern: /\bnew\s+Function\s*\(/, message: "Function constructor" },
  { pattern: /\bdocument\.write\s*\(/, message: "document.write()" },
  { pattern: /\bset(?:Timeout|Interval)\s*\(\s*["']/, message: "string-based timer" },
  { pattern: /\bimport\s*\(\s*["']https?:/, message: "remote dynamic import" },
  { pattern: /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/, message: "network API" },
  { pattern: /\bnavigator\.sendBeacon\b/, message: "beacon API" },
  { pattern: /\bimportScripts\s*\(/, message: "worker script import" },
  {
    pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    message: "persistent browser storage",
  },
  { pattern: /\bdocument\.cookie\b/, message: "cookie access" },
];

const requiredCspDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
];

const errors = [];

function fail(scope, message) {
  errors.push(`${scope}: ${message}`);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scanContent(scope, content, rules) {
  for (const rule of rules) {
    if (rule.pattern.test(content)) {
      fail(scope, `blocked pattern: ${rule.message}`);
    }
  }
}

function stripJavaScriptLiterals(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n\r]*/g, " ")
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, " ")
    .replace(/"(?:\\[\s\S]|[^"\\])*"/g, " ")
    .replace(/'(?:\\[\s\S]|[^'\\])*'/g, " ");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function validateString(scope, value, options = {}) {
  const { max = 200, pattern } = options;

  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    value.length > max
  ) {
    fail(scope, `must be a non-empty trimmed string up to ${max} chars`);
    return false;
  }

  if (pattern && !pattern.test(value)) {
    fail(scope, "has an invalid format");
    return false;
  }

  return true;
}

function validateSourceUrl(scope, value) {
  if (!validateString(scope, value, { max: 500 })) {
    return;
  }

  const isHttpsUrl = /^https:\/\/[^\s"'<>]+$/i.test(value);
  const isLocalPath = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[a-z0-9._/-]+$/i.test(value);

  if (!isHttpsUrl && !isLocalPath) {
    fail(scope, "must be an https URL or a safe local source path");
  }
}

function validateCsp(scope, html) {
  const cspMatch = html.match(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i);

  if (!cspMatch) {
    fail(scope, "missing Content-Security-Policy meta tag");
    return;
  }

  const contentMatch =
    cspMatch[0].match(/\scontent="([^"]+)"/i) ?? cspMatch[0].match(/\scontent='([^']+)'/i);

  if (!contentMatch) {
    fail(scope, "Content-Security-Policy meta tag is missing content");
    return;
  }

  const csp = contentMatch[1].replace(/\s+/g, " ").trim();
  for (const directive of requiredCspDirectives) {
    if (!csp.includes(directive)) {
      fail(scope, `CSP missing directive: ${directive}`);
    }
  }
}

/**
 * Extract sibling asset references from `<link rel="stylesheet" href="...">`,
 * `<script src="...">`, and the media tags `<img src="...">`,
 * `<video src="...">`, and `<source src="...">`. Each reference must be a
 * relative `./<filename>` path with no traversal segments and no remote URL.
 * Tags without a `src` are skipped here (e.g. `<source srcset>` inside a
 * `<picture>` is not statically validated; the directory still cannot ship
 * unknown extensions, so any actually-loaded sibling is still constrained).
 */
function extractHtmlAssetReferences(scope, html) {
  const styleHrefs = [];
  const scriptSrcs = [];
  const mediaSrcs = [];

  const linkPattern = /<link\b([^>]*)\/?>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const attrs = match[1] ?? "";
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(attrs)) {
      continue;
    }
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) {
      fail(scope, "stylesheet link is missing an href");
      continue;
    }
    styleHrefs.push(hrefMatch[1]);
  }

  const scriptPattern = /<script\b([^>]*)>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const attrs = match[1] ?? "";
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) {
      fail(scope, "inline or attribute-less script tag is not allowed");
      continue;
    }
    scriptSrcs.push(srcMatch[1]);
  }

  const mediaTagPattern = /<(?:img|video|source)\b([^>]*)\/?>/gi;
  for (const match of html.matchAll(mediaTagPattern)) {
    const attrs = match[1] ?? "";
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) {
      continue;
    }
    mediaSrcs.push(srcMatch[1]);
  }

  return { styleHrefs, scriptSrcs, mediaSrcs };
}

function isSafeSiblingPath(value) {
  if (typeof value !== "string" || !value.startsWith("./")) {
    return false;
  }
  const remainder = value.slice(2);
  if (remainder.length === 0 || remainder.includes("/") || remainder.includes("\\")) {
    return false;
  }
  return filenamePattern.test(remainder);
}

async function validateShowcase(entry) {
  const dir = path.join(rootDir, entry.name);
  const scope = entry.name;
  const entries = await readdir(dir, { withFileTypes: true });
  const fileNames = entries
    .filter((file) => file.isFile())
    .map((file) => file.name)
    .sort();
  const directoryNames = entries.filter((file) => file.isDirectory()).map((file) => file.name);

  for (const directoryName of directoryNames) {
    fail(scope, `nested directories are not allowed: ${directoryName}`);
  }

  for (const requiredFile of requiredCoreFiles) {
    if (!fileNames.includes(requiredFile)) {
      fail(scope, `missing required file: ${requiredFile}`);
    }
  }

  if (fileNames.length > maxFileCount) {
    fail(
      scope,
      `must ship at most ${maxFileCount} files (got ${fileNames.length}); ` +
        "trim the bundle or split it into multiple showcases",
    );
  }

  const cssFiles = [];
  const jsFiles = [];
  const mediaFiles = [];

  for (const fileName of fileNames) {
    if (requiredCoreFiles.includes(fileName)) {
      continue;
    }

    if (!filenamePattern.test(fileName)) {
      fail(scope, `unexpected filename: ${fileName}`);
      continue;
    }

    const ext = path.extname(fileName).toLowerCase();
    if (!allowedAssetExtensions.has(ext)) {
      fail(scope, `unexpected file: ${fileName}`);
      continue;
    }

    if (stylesheetExtensions.has(ext)) {
      cssFiles.push(fileName);
    } else if (scriptExtensions.has(ext)) {
      jsFiles.push(fileName);
    } else if (mediaExtensions.has(ext)) {
      mediaFiles.push(fileName);
    }
  }

  if (cssFiles.length === 0) {
    fail(scope, "must ship at least one stylesheet (.css)");
  }
  if (jsFiles.length === 0) {
    fail(scope, "must ship at least one script (.js or .mjs)");
  }

  if (!fileNames.includes("index.html") || !fileNames.includes("metadata.json")) {
    return;
  }

  const fileBuffers = new Map();
  await Promise.all(
    fileNames.map(async (fileName) => {
      fileBuffers.set(fileName, await readFile(path.join(dir, fileName)));
    }),
  );

  for (const fileName of fileNames) {
    const buffer = fileBuffers.get(fileName);
    if (buffer.byteLength > maxFileBytes) {
      fail(
        `${scope}/${fileName}`,
        `file is ${formatBytes(buffer.byteLength)}; per-file size cap is ${formatBytes(maxFileBytes)}`,
      );
    }
  }

  const html = fileBuffers.get("index.html").toString("utf8");
  const metadataBuffer = fileBuffers.get("metadata.json");

  let metadata;
  try {
    metadata = JSON.parse(metadataBuffer.toString("utf8"));
  } catch (error) {
    fail(`${scope}/metadata.json`, `invalid JSON: ${error.message}`);
    return;
  }

  const assetFileNames = [...cssFiles, ...jsFiles, ...mediaFiles];
  validateMetadata(scope, metadata, { cssFiles, jsFiles, mediaFiles });
  validateAssetIntegrity(scope, metadata, fileBuffers, assetFileNames);

  const { styleHrefs, scriptSrcs, mediaSrcs } = extractHtmlAssetReferences(
    `${scope}/index.html`,
    html,
  );

  if (styleHrefs.length === 0) {
    fail(`${scope}/index.html`, 'must link at least one stylesheet via <link rel="stylesheet">');
  }
  if (scriptSrcs.length === 0) {
    fail(`${scope}/index.html`, 'must load at least one script via <script src="./...">');
  }

  for (const href of styleHrefs) {
    if (!isSafeSiblingPath(href)) {
      fail(`${scope}/index.html`, `stylesheet href must be a relative ./filename: ${href}`);
      continue;
    }
    const fileName = href.slice(2);
    if (!cssFiles.includes(fileName)) {
      fail(`${scope}/index.html`, `stylesheet href references missing sibling: ${href}`);
    }
  }

  for (const src of scriptSrcs) {
    if (!isSafeSiblingPath(src)) {
      fail(`${scope}/index.html`, `script src must be a relative ./filename: ${src}`);
      continue;
    }
    const fileName = src.slice(2);
    if (!jsFiles.includes(fileName)) {
      fail(`${scope}/index.html`, `script src references missing sibling: ${src}`);
    }
  }

  for (const src of mediaSrcs) {
    if (!isSafeSiblingPath(src)) {
      fail(
        `${scope}/index.html`,
        `<img>/<video>/<source> src must be a relative ./filename: ${src}`,
      );
      continue;
    }
    const fileName = src.slice(2);
    if (!mediaFiles.includes(fileName)) {
      fail(`${scope}/index.html`, `<img>/<video>/<source> src references missing sibling: ${src}`);
    }
  }

  validateCsp(`${scope}/index.html`, html);
  scanContent(`${scope}/index.html`, html, htmlBlocklist);

  for (const cssFile of cssFiles) {
    const css = fileBuffers.get(cssFile).toString("utf8");
    scanContent(`${scope}/${cssFile}`, css, cssBlocklist);
  }

  for (const jsFile of jsFiles) {
    const js = fileBuffers.get(jsFile).toString("utf8");
    scanContent(`${scope}/${jsFile}`, stripJavaScriptLiterals(js), jsBlocklist);
  }

  for (const mediaFile of mediaFiles) {
    if (path.extname(mediaFile).toLowerCase() !== svgExtension) {
      continue;
    }
    const svg = fileBuffers.get(mediaFile).toString("utf8");
    scanContent(`${scope}/${mediaFile}`, svg, svgBlocklist);
  }
}

function validateMetadata(scope, metadata, { cssFiles, jsFiles, mediaFiles }) {
  if (!isObject(metadata)) {
    fail(`${scope}/metadata.json`, "must contain an object");
    return;
  }

  validateString(`${scope}.id`, metadata.id, { pattern: idPattern });
  if (metadata.id !== scope) {
    fail(`${scope}.id`, "must match the directory name");
  }

  validateString(`${scope}.title`, metadata.title, { max: 120 });
  validateSourceUrl(`${scope}.sourceUrl`, metadata.sourceUrl);
  validateString(`${scope}.sourcePlatform`, metadata.sourcePlatform, { max: 80 });
  validateString(`${scope}.originalFile`, metadata.originalFile, { max: 500 });
  validateString(`${scope}.assetPath`, metadata.assetPath, { max: 500 });
  validateString(`${scope}.importedAt`, metadata.importedAt, { pattern: datePattern });

  if (metadata.assetPath !== `/community-showcases/${scope}/index.html`) {
    fail(`${scope}.assetPath`, "must point to this showcase index.html");
  }

  if (!Array.isArray(metadata.tags) || metadata.tags.length === 0 || metadata.tags.length > 12) {
    fail(`${scope}.tags`, "must contain 1-12 tags");
  } else {
    for (const tag of metadata.tags) {
      validateString(`${scope}.tags[]`, tag, { max: 32, pattern: tagPattern });
    }
  }

  if (metadata.environment !== undefined) {
    if (typeof metadata.environment !== "string" || !knownEnvironments.has(metadata.environment)) {
      fail(`${scope}.environment`, `must be one of ${[...knownEnvironments].join(", ")}`);
    }
  }

  if (metadata.assets !== undefined) {
    validateAssetsField(scope, metadata.assets, { cssFiles, jsFiles, mediaFiles });
  }

  if (metadata.downloads !== undefined) {
    validateDownloads(scope, metadata.downloads);
  }

  if (!isObject(metadata.files)) {
    fail(`${scope}.files`, "must contain file integrity records");
    return;
  }

  const expectedAssetFiles = ["index.html", ...cssFiles, ...jsFiles, ...mediaFiles];

  for (const fileName of expectedAssetFiles) {
    const record = metadata.files[fileName];
    if (!isObject(record)) {
      fail(`${scope}.files.${fileName}`, "must contain sha256 and bytes");
      continue;
    }

    validateString(`${scope}.files.${fileName}.sha256`, record.sha256, {
      max: 64,
      pattern: hashPattern,
    });
    if (!Number.isSafeInteger(record.bytes) || record.bytes <= 0) {
      fail(`${scope}.files.${fileName}.bytes`, "must be a positive safe integer");
    }
  }

  for (const fileName of Object.keys(metadata.files)) {
    if (!expectedAssetFiles.includes(fileName)) {
      fail(`${scope}.files`, `unexpected file integrity record: ${fileName}`);
    }
  }
}

function validateAssetsField(scope, assets, { cssFiles, jsFiles, mediaFiles }) {
  if (!isObject(assets)) {
    fail(`${scope}.assets`, "must be an object with html, styles, and scripts");
    return;
  }

  if (assets.html !== "index.html") {
    fail(`${scope}.assets.html`, 'must equal "index.html"');
  }

  if (!Array.isArray(assets.styles) || assets.styles.length === 0) {
    fail(`${scope}.assets.styles`, "must list at least one stylesheet filename");
  } else {
    for (const file of assets.styles) {
      if (typeof file !== "string" || !cssFiles.includes(file)) {
        fail(`${scope}.assets.styles[]`, `unknown stylesheet sibling: ${String(file)}`);
      }
    }
    for (const cssFile of cssFiles) {
      if (!assets.styles.includes(cssFile)) {
        fail(`${scope}.assets.styles`, `must list every shipped stylesheet: missing ${cssFile}`);
      }
    }
  }

  if (!Array.isArray(assets.scripts) || assets.scripts.length === 0) {
    fail(`${scope}.assets.scripts`, "must list at least one script filename");
  } else {
    for (const file of assets.scripts) {
      if (typeof file !== "string" || !jsFiles.includes(file)) {
        fail(`${scope}.assets.scripts[]`, `unknown script sibling: ${String(file)}`);
      }
    }
    for (const jsFile of jsFiles) {
      if (!assets.scripts.includes(jsFile)) {
        fail(`${scope}.assets.scripts`, `must list every shipped script: missing ${jsFile}`);
      }
    }
  }

  if (assets.media !== undefined) {
    if (!Array.isArray(assets.media)) {
      fail(`${scope}.assets.media`, "must be an array of video filenames when provided");
      return;
    }
    for (const file of assets.media) {
      if (typeof file !== "string" || !mediaFiles.includes(file)) {
        fail(`${scope}.assets.media[]`, `unknown media sibling: ${String(file)}`);
      }
    }
    for (const mediaFile of mediaFiles) {
      if (!assets.media.includes(mediaFile)) {
        fail(`${scope}.assets.media`, `must list every shipped media file: missing ${mediaFile}`);
      }
    }
  } else if (mediaFiles.length > 0) {
    fail(
      `${scope}.assets.media`,
      "must list every shipped media file when the directory contains video assets",
    );
  }
}

function validateDownloads(scope, downloads) {
  if (!Array.isArray(downloads) || downloads.length === 0) {
    fail(`${scope}.downloads`, "must be a non-empty array when provided");
    return;
  }

  const seenKinds = new Set();

  for (let index = 0; index < downloads.length; index += 1) {
    const entry = downloads[index];
    const entryScope = `${scope}.downloads[${index}]`;

    if (!isObject(entry)) {
      fail(entryScope, "must be an object with kind, label, and url");
      continue;
    }

    if (!validateString(`${entryScope}.kind`, entry.kind, { max: 32, pattern: idPattern })) {
      continue;
    }

    if (seenKinds.has(entry.kind)) {
      fail(`${entryScope}.kind`, `duplicate download kind: ${entry.kind}`);
    }
    seenKinds.add(entry.kind);

    validateString(`${entryScope}.label`, entry.label, { max: 80 });

    if (!validateString(`${entryScope}.url`, entry.url, { max: 200 })) {
      continue;
    }

    if (!downloadUrlPattern.test(entry.url)) {
      fail(
        `${entryScope}.url`,
        "must be a /community-zips/<id>.zip path served from the same origin",
      );
    }

    if (entry.description !== undefined) {
      validateString(`${entryScope}.description`, entry.description, { max: 240 });
    }
  }
}

function validateAssetIntegrity(scope, metadata, fileBuffers, assetFileNames) {
  if (!isObject(metadata) || !isObject(metadata.files)) {
    return;
  }

  const tracked = ["index.html", ...assetFileNames];
  for (const fileName of tracked) {
    const record = metadata.files[fileName];
    if (!isObject(record)) {
      continue;
    }

    const buffer = fileBuffers.get(fileName);
    if (!buffer) {
      continue;
    }

    if (record.sha256 !== sha256(buffer)) {
      fail(`${scope}.files.${fileName}.sha256`, "does not match file content");
    }

    if (record.bytes !== buffer.byteLength) {
      fail(`${scope}.files.${fileName}.bytes`, "does not match file size");
    }
  }
}

async function main() {
  let rootStat;
  try {
    rootStat = await stat(rootDir);
  } catch {
    fail("community-showcases", "directory does not exist");
  }

  if (!rootStat?.isDirectory()) {
    fail("community-showcases", "must be a directory");
  } else {
    const entries = await readdir(rootDir, { withFileTypes: true });
    const showcaseDirs = entries
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    if (showcaseDirs.length === 0) {
      fail("community-showcases", "must contain at least one showcase");
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        fail("community-showcases", `unexpected file at root: ${entry.name}`);
      }
    }

    for (const entry of showcaseDirs) {
      if (!idPattern.test(entry.name)) {
        fail(entry.name, "directory name must be kebab-case");
        continue;
      }

      await validateShowcase(entry);
    }
  }

  if (errors.length > 0) {
    console.error("Community showcase validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Community showcase validation passed.");
}

await main();
