# Evolver sanitize.js — false positive on FSD project paths

**Affected:** `@evomap/evolver` → `src/gep/sanitize.js` → `LEAK_SCANNERS` → `local_path`

## Symptom

`fullLeakCheck()` reports a `local_path` leak on git diff stat output when the
repository contains a path segment like `pages/home/model/` (common in
Feature-Sliced Design / Next.js-style projects).

Example offending line in `git diff --stat HEAD`:

```
 src/pages/home/model/orbit-cards.ts          |   4 +-
```

The current regex

```js
{ type: 'local_path', pattern: /\/home\/[a-zA-Z0-9_.-]+\//g, suggest: 'process.env.HOME' }
```

greedily matches the substring `/home/model/` even though the `/home/` is not
at the start of a filesystem path and has a preceding letter (`s`, from
`pages`). The same bug can fire on Unix-style CI log lines that reference
`/home/<subdir>/` for non-user purposes.

## Repro

```bash
node -e "const {fullLeakCheck} = require('@evomap/evolver/src/gep/sanitize'); \
  console.log(fullLeakCheck('src/pages/home/model/foo.ts'))"
# => { found: true, leaks: [ { type: 'local_path', value: '/home/model/', ... } ] }
```

## Suggested fix

Require the `/home/` prefix to be at a boundary (start of string or
non-identifier character) so regular path fragments that _contain_ the literal
`home` segment are not matched. Apply the same fix to `/Users/`.

```diff
-  { type: 'local_path', pattern: /\/home\/[a-zA-Z0-9_.-]+\//g, suggest: 'process.env.HOME' },
-  { type: 'local_path', pattern: /\/Users\/[a-zA-Z0-9_.-]+\//g, suggest: 'process.env.HOME' },
+  { type: 'local_path', pattern: /(?:^|[\s:'"(\[,;=])\/home\/[a-zA-Z0-9_.-]+\//g, suggest: 'process.env.HOME' },
+  { type: 'local_path', pattern: /(?:^|[\s:'"(\[,;=])\/Users\/[a-zA-Z0-9_.-]+\//g, suggest: 'process.env.HOME' },
```

The Windows variant (`[A-Z]:\\Users\\...`) already has a drive-letter anchor
and doesn't need changing.

Also applies to `REDACT_PATTERNS` in the same file (lines 48-50) if
`sanitizePayload` is exercised on project files directly.

## Why this matters

Session-end hooks that sanity-check a diff `--stat` before publishing a
capsule silently drop every publish attempt for FSD repos. The publish failure
is reported as `reason: leak_check_failed` with no value surfaced, so users
see repeated `Auto asset publish skipped: leak_check_failed` lines with no
obvious cause.
