import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve("public/community-showcases");
const requiredFiles = ["index.html", "styles.css", "script.js", "metadata.json"];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const tagPattern = /^[a-z0-9][a-z0-9-]{0,31}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const htmlBlocklist = [
  {
    pattern: /<script\b(?![^>]*\bsrc=["']\.\/script\.js["'])/i,
    message: "inline or unexpected script tag",
  },
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
    return;
  }

  if (pattern && !pattern.test(value)) {
    fail(scope, "has an invalid format");
  }
}

function validateSourceUrl(scope, value) {
  validateString(scope, value, { max: 500 });

  if (typeof value !== "string") {
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

  for (const requiredFile of requiredFiles) {
    if (!fileNames.includes(requiredFile)) {
      fail(scope, `missing required file: ${requiredFile}`);
    }
  }

  for (const fileName of fileNames) {
    if (!requiredFiles.includes(fileName)) {
      fail(scope, `unexpected file: ${fileName}`);
    }
  }

  if (!requiredFiles.every((fileName) => fileNames.includes(fileName))) {
    return;
  }

  const [htmlBuffer, cssBuffer, jsBuffer, metadataBuffer] = await Promise.all(
    requiredFiles.map((fileName) => readFile(path.join(dir, fileName))),
  );
  const html = htmlBuffer.toString("utf8");
  const css = cssBuffer.toString("utf8");
  const js = jsBuffer.toString("utf8");

  let metadata;
  try {
    metadata = JSON.parse(metadataBuffer.toString("utf8"));
  } catch (error) {
    fail(`${scope}/metadata.json`, `invalid JSON: ${error.message}`);
    return;
  }

  validateMetadata(scope, metadata);
  validateAssetIntegrity(scope, metadata, { htmlBuffer, cssBuffer, jsBuffer });

  if (!html.includes('<link rel="stylesheet" href="./styles.css" />')) {
    fail(`${scope}/index.html`, "must link ./styles.css exactly once");
  }

  if (!html.includes('<script src="./script.js"></script>')) {
    fail(`${scope}/index.html`, "must load ./script.js exactly once");
  }

  validateCsp(`${scope}/index.html`, html);
  scanContent(`${scope}/index.html`, html, htmlBlocklist);
  scanContent(`${scope}/styles.css`, css, cssBlocklist);
  scanContent(`${scope}/script.js`, stripJavaScriptLiterals(js), jsBlocklist);
}

function validateMetadata(scope, metadata) {
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

  if (!isObject(metadata.files)) {
    fail(`${scope}.files`, "must contain file integrity records");
    return;
  }

  for (const fileName of ["index.html", "styles.css", "script.js"]) {
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
}

function validateAssetIntegrity(scope, metadata, buffers) {
  if (!isObject(metadata) || !isObject(metadata.files)) {
    return;
  }

  const records = {
    "index.html": buffers.htmlBuffer,
    "styles.css": buffers.cssBuffer,
    "script.js": buffers.jsBuffer,
  };

  for (const [fileName, buffer] of Object.entries(records)) {
    const record = metadata.files[fileName];
    if (!isObject(record)) {
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
