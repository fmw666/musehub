#!/usr/bin/env node
/**
 * Motion report + discipline guard for MuseHub's motion layer.
 *
 * Scans the repo to answer three questions without requiring humans to keep
 * docs/adr/0002-animate-ui-motion-only.md hand-synced:
 *
 *   1. What motion atoms currently live in src/shared/ui/motion/?
 *   2. What files consume @/shared/ui/motion, and which atoms from it?
 *   3. Does each atom follow the ADR 0002 discipline (upstream attribution
 *      header, reduced-motion handling, and an adjacent unit test)?
 *
 * By default this is a guard: if the discipline checks find violations, the
 * script exits non-zero. Pass `--report-only` to suppress the non-zero exit
 * and keep the script pure reporting (useful when iterating locally).
 *
 * Discipline rules enforced:
 *   D1. Upstream attribution — the first 20 lines of the atom source must
 *       mention either "Animate UI" or "animate-ui.com". ADR 0002 requires
 *       each ported file to declare its upstream.
 *   D2. Reduced-motion awareness — the atom source must import
 *       `useReducedMotion` from `motion/react` or mention the literal
 *       `prefers-reduced-motion` somewhere. ADR 0002 requires motion
 *       atoms to honor the user preference.
 *   D3. Adjacent unit test — the atom source must have a sibling
 *       `<Atom>.test.tsx` next to it.
 *
 * Wired up as `npm run guard:motion` for discoverability.
 *
 * Run:
 *   npm run guard:motion
 *   npm run guard:motion -- --report-only   # never fail, just report
 *   node scripts/motion-report.mjs --json   # machine-readable output
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(repoRoot, "src");
const motionDir = path.join(srcRoot, "shared", "ui", "motion");

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const reportOnly = args.has("--report-only");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// 1. Discover atoms by reading src/shared/ui/motion/index.ts.
const atoms = [];
const indexPath = path.join(motionDir, "index.ts");
try {
  const content = readFileSync(indexPath, "utf8");
  // match `export { Name ... } from "./Name"` lines
  const re = /export\s*\{\s*([^}]+?)\s*\}\s*from\s*["']\.\/([A-Za-z][A-Za-z0-9_]*)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    // Pull the first identifier (the primary export) from the brace list,
    // ignoring `type X` re-exports and aliases.
    const first = m[1]
      .split(",")
      .map((s) => s.trim())
      .find((s) => s && !s.startsWith("type "));
    if (first) {
      const name = first.replace(/\s+as\s+.+$/, "").trim();
      atoms.push({
        name,
        file: `src/shared/ui/motion/${m[2]}.tsx`,
        absFile: path.join(motionDir, `${m[2]}.tsx`),
        basename: m[2],
      });
    }
  }
} catch (err) {
  console.error(`[motion-report] cannot read ${indexPath}: ${err.message}`);
  process.exit(1);
}

// 1b. Discipline checks. One list of violations per atom.
// Each atom may accumulate multiple violations; we still report all of them.
const violations = [];
for (const atom of atoms) {
  const issues = [];
  let source = "";
  if (!existsSync(atom.absFile)) {
    issues.push(`missing source file at ${atom.file}`);
  } else {
    try {
      source = readFileSync(atom.absFile, "utf8");
    } catch (err) {
      issues.push(`cannot read ${atom.file}: ${err.message}`);
    }
  }

  if (source) {
    // D1: upstream attribution in the first 20 lines.
    const head = source.split("\n").slice(0, 20).join("\n");
    const hasUpstream = /Animate UI|animate-ui\.com/i.test(head);
    if (!hasUpstream) {
      issues.push(
        "D1: first 20 lines do not mention 'Animate UI' or 'animate-ui.com' (ADR 0002 requires each ported file to declare its upstream).",
      );
    }

    // D2: reduced-motion awareness.
    const importsReducedMotion =
      /import\s*\{[^}]*\buseReducedMotion\b[^}]*\}\s*from\s*["']motion\/react["']/.test(source);
    const mentionsPreference = /prefers-reduced-motion/.test(source);
    if (!importsReducedMotion && !mentionsPreference) {
      issues.push(
        "D2: no `useReducedMotion` import from 'motion/react' and no 'prefers-reduced-motion' mention (ADR 0002 requires motion atoms to honor the user preference).",
      );
    }
  }

  // D3: adjacent unit test.
  const testPath = path.join(motionDir, `${atom.basename}.test.tsx`);
  if (!existsSync(testPath)) {
    issues.push(
      `D3: no adjacent unit test at src/shared/ui/motion/${atom.basename}.test.tsx (ADR 0002 checklist step 5).`,
    );
  }

  if (issues.length > 0) {
    violations.push({ atom: atom.name, file: atom.file, issues });
  }
}

// 2. Discover consumers: any .ts/.tsx under src/ that imports from
// @/shared/ui/motion, along with which symbols they pull in.
const consumers = [];
const files = walk(srcRoot);
const importRe = /import\s*\{\s*([^}]+?)\s*\}\s*from\s*["']@\/shared\/ui\/motion["']/g;

for (const absFile of files) {
  const rel = path.relative(repoRoot, absFile).replace(/\\/g, "/");
  // Don't report the motion directory itself as a consumer.
  if (rel.startsWith("src/shared/ui/motion/")) continue;

  const source = readFileSync(absFile, "utf8");
  let match;
  const names = new Set();
  while ((match = importRe.exec(source)) !== null) {
    for (const raw of match[1].split(",")) {
      const token = raw.trim();
      if (!token) continue;
      if (token.startsWith("type ")) continue; // type-only imports don't count as usage
      const name = token.replace(/\s+as\s+.+$/, "").trim();
      if (name) names.add(name);
    }
  }
  if (names.size > 0) {
    consumers.push({ file: rel, atoms: [...names].sort() });
  }
}
consumers.sort((a, b) => a.file.localeCompare(b.file));

// 3. Atom usage index (atom -> list of consuming files).
const atomUsage = new Map();
for (const atom of atoms) atomUsage.set(atom.name, []);
for (const c of consumers) {
  for (const name of c.atoms) {
    if (!atomUsage.has(name)) atomUsage.set(name, []);
    atomUsage.get(name).push(c.file);
  }
}

if (asJson) {
  const payload = {
    atoms: atoms.map(({ name, file }) => ({ name, file })),
    consumers,
    usage: Object.fromEntries([...atomUsage.entries()].map(([name, fileList]) => [name, fileList])),
    violations,
  };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(violations.length > 0 && !reportOnly ? 1 : 0);
}

console.log("[motion-report] motion atoms (src/shared/ui/motion/)");
if (atoms.length === 0) {
  console.log("  (none)");
} else {
  for (const atom of atoms) {
    const users = atomUsage.get(atom.name) ?? [];
    console.log(`  ${atom.name.padEnd(16)} ${users.length} usage(s)  <- ${atom.file}`);
  }
}

console.log("\n[motion-report] consumers (import from @/shared/ui/motion)");
if (consumers.length === 0) {
  console.log("  (none)");
} else {
  for (const c of consumers) {
    console.log(`  ${c.file}`);
    console.log(`    uses: ${c.atoms.join(", ")}`);
  }
}

console.log("\n[motion-report] per-atom consumers");
for (const [name, fileList] of atomUsage) {
  console.log(`  ${name}:`);
  if (fileList.length === 0) {
    console.log("    (unused — consider removing if this persists)");
  } else {
    for (const f of fileList) console.log(`    - ${f}`);
  }
}

console.log("\n[motion-report] discipline (ADR 0002)");
if (violations.length === 0) {
  console.log(
    `  ${atoms.length}/${atoms.length} atoms pass D1 (upstream), D2 (reduced-motion), D3 (adjacent test).`,
  );
} else {
  for (const v of violations) {
    console.log(`  ${v.atom}  (${v.file})`);
    for (const issue of v.issues) {
      console.log(`    - ${issue}`);
    }
  }
}

if (violations.length > 0) {
  if (reportOnly) {
    console.log("\n[motion-report] violations found but --report-only was passed; exit 0.");
    process.exit(0);
  }
  console.error("\n[motion-report] discipline violations found; exit 1.");
  console.error(
    "  Fix the issues above, add `--report-only` to keep iterating, or update docs/adr/0002-animate-ui-motion-only.md if the rule should change.",
  );
  process.exit(1);
}
