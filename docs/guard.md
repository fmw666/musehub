# Structural Guard

Protects the project from a specific kind of bug class that wastes the most time:

> The IDE shows a red `@typescript-eslint` error (e.g. `Unsafe assignment of an error typed value`, `Unsafe call of a type that could not be resolved`, `Unsafe argument of type error typed ...`), but the code is actually correct. The CLI tools (`tsc`, `eslint`) are clean.

The guard has three layers.

## Layer 1 - Runtime structural contract

When a module depends on a cross-file type and is hit by the "unsafe-\*" class of false positives, isolate it locally:

1. Declare a **local input type** in the same file with only the fields the module reads.
2. Add a **type guard** (`isFooInput(value): value is FooInput`) that validates shape at runtime.
3. Bind the narrowed value to a typed local (`const input: FooInput = value;`) and use `input.*` everywhere.

Example: `src/entities/showcase/model/copy-prompt.ts`.

Why this works:

- The function body no longer relies on the IDE's cross-file type resolution. Even if the external type gets mis-resolved as `error`, the local contract is fully self-contained.
- The runtime guard makes the file robust to malformed data in addition to silencing the lint false positive.

## Layer 2 - CLI verdict script

Run:

```bash
npm run guard
```

This runs `tsc --noEmit` and `eslint` and prints a clear verdict:

- Both PASS -> the code is fine. Any remaining IDE squiggles are a language-service cache issue. Restart the TS / ESLint servers in the IDE.
- Either FAILs -> real error, fix the code.

The verdict explicitly tells you **not** to add workaround casts or disable rules based on IDE-only errors.

## Layer 3 - Diagnostic order

When you see an "unsafe-\*" error, do this order before editing code:

1. `npm run guard`.
2. If both pass:
   - Command Palette -> `ESLint: Restart ESLint Server`.
   - Command Palette -> `TypeScript: Restart TS Server`.
   - Close and reopen the file.
3. If guard fails, read the CLI output - that is the real error.
4. Only if guard passes but the error persists across IDE restarts, apply the Layer 1 pattern to the affected module.

## Why this exists

The `@typescript-eslint` rules that read "error typed value" or "type that could not be resolved" report what the type service saw, not what the type graph truly is. Cursor / VS Code language services occasionally drop cached resolutions for path aliases or barrel re-exports, which flips a type into `error` state for that session only. The guard distinguishes that case from a real error in one command.

## Anti-patterns to avoid

- Adding `// eslint-disable-next-line @typescript-eslint/no-unsafe-*` based on IDE-only red.
- Replacing a correct type with `any` to silence the IDE.
- Repeatedly editing the file to "wake up" the language service. Restart the server instead.
