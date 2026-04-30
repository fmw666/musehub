#!/usr/bin/env node
/**
 * Structural type-resolution guard.
 *
 * Purpose:
 *   Catch the "CLI green / IDE red" class of @typescript-eslint false positives
 *   where the IDE language service reports "unsafe-*" / "error typed value"
 *   even though the code is correct.
 *
 * What it does:
 *   1. Runs `tsc --noEmit`            -> proves the type graph is sound.
 *   2. Runs `eslint` on the repo      -> proves ESLint agrees at CLI level.
 *   3. Prints a clear verdict:
 *        - If both pass:  code is OK. Any remaining red squiggles in the IDE
 *                         are stale language-service state -> restart TS / ESLint server.
 *        - If either fails: real error; surfaces the failing command output.
 *
 * Usage:
 *   npm run guard
 *   npm run guard -- --quiet       # only print verdict
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const quiet = process.argv.includes("--quiet");

function run(label, command, args) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    shell: true,
    encoding: "utf8",
  });
  const elapsed = Date.now() - started;
  return {
    label,
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    elapsed,
  };
}

function print(section, text) {
  if (quiet) return;
  if (!text.trim()) return;
  process.stdout.write(`\n--- ${section} ---\n${text.trim()}\n`);
}

function heading(title) {
  if (quiet) return;
  process.stdout.write(`\n==> ${title}\n`);
}

heading("[guard 1/2] tsc --noEmit");
const tsc = run("tsc", "npx", ["tsc", "--noEmit", "-p", "tsconfig.json"]);
print("tsc stdout", tsc.stdout);
print("tsc stderr", tsc.stderr);

heading("[guard 2/2] eslint");
const eslint = run("eslint", "npx", [
  "eslint",
  '"src/**/*.{ts,tsx}"',
  '"vite.config.ts"',
  '"vitest.config.ts"',
]);
print("eslint stdout", eslint.stdout);
print("eslint stderr", eslint.stderr);

process.stdout.write("\n================ STRUCTURAL GUARD VERDICT ================\n");
process.stdout.write(
  `  tsc     : ${tsc.ok ? "PASS" : "FAIL"}  (${tsc.elapsed} ms, exit ${tsc.status})\n`,
);
process.stdout.write(
  `  eslint  : ${eslint.ok ? "PASS" : "FAIL"}  (${eslint.elapsed} ms, exit ${eslint.status})\n`,
);

if (tsc.ok && eslint.ok) {
  process.stdout.write(
    [
      "",
      "  VERDICT: Source code is structurally clean at the CLI level.",
      "  If your IDE still shows red squiggles (e.g. 'Unsafe assignment of an",
      "  error typed value', 'type that could not be resolved'), this is a",
      "  language-service cache issue, NOT a code issue.",
      "",
      "  Action:",
      "    1. Command Palette -> 'ESLint: Restart ESLint Server'",
      "    2. Command Palette -> 'TypeScript: Restart TS Server'",
      "    3. Close and reopen the affected file if still stuck.",
      "",
      "  DO NOT add workaround casts or disable rules based on IDE-only errors.",
      "==========================================================",
      "",
    ].join("\n"),
  );
  process.exit(0);
} else {
  process.stdout.write(
    [
      "",
      "  VERDICT: Real error detected at the CLI level. Fix the code.",
      "  (If this is a cross-file type-resolution failure, see docs/guard.md",
      "   for the structural-guard remediation pattern.)",
      "==========================================================",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
