# ADR 0002: Animate UI Is Motion-Only, HeroUI Remains The Component System

## Status

Accepted

## Context

[Animate UI](https://animate-ui.com/) is an open-source, copy-paste component
distribution built on React, Tailwind CSS, and Motion (formerly Framer Motion).
It provides three categories of assets:

1. Primitives — animated wrappers over Radix / Base UI / Headless UI.
2. Components — shadcn-style Button, Card, Input, etc.
3. Icons — animated Lucide icons.
4. Effects — motion-focused atoms (Counter, Gradient Text, Blur Fade, Motion
   Highlight, Animated Background, Typing Text, etc.).

Categories 1 and 2 overlap directly with HeroUI v3, which is the mandated
component system for MuseHub (see `AGENTS.md`, `docs/standards.md`, and
`.cursor/rules/heroui-v3-components.mdc`). HeroUI v3 supplies accessible
overlays, forms, menus, scroll surfaces, and field primitives (`Modal` with
compound sub-components, `SearchField`, `Kbd`, `ScrollShadow`, `Form`,
`useOverlayState`) that Animate UI does not provide. Replacing HeroUI with
Animate UI would mean re-implementing those primitives by hand while also
replacing the design token system.

Categories 3 and 4, however, fill a real gap: HeroUI intentionally avoids
decorative motion, so MuseHub currently has no first-class solution for
entrance animations, counter rolls, gradient text, or hover micro-interactions.

## Decision

Animate UI is allowed in MuseHub for **motion effects and animated icons
only**. HeroUI v3 remains the single source of truth for component primitives.

Concretely:

1. HeroUI v3 is mandatory for buttons, cards, chips, inputs, forms, modals,
   popovers, menus, tabs, tooltips, switches, scroll surfaces, search fields,
   kbd, and any other interactive or accessible primitive. This does not
   change.
2. Animate UI source may be copy-pasted into MuseHub only under:
   - `src/shared/ui/motion/**` — motion effect atoms (Counter, BlurFade,
     GradientText, MotionHighlight, TypingText, AnimatedBackground, etc.).
   - `src/shared/ui/icons/animated/**` — animated Lucide icons.
3. Animate UI's component category (Button, Card, Input, Dialog, Tabs,
   Tooltip, Popover, Accordion, Dropdown, Select, Checkbox, Switch, Badge,
   Avatar, Skeleton, Spinner, etc.) is banned. HeroUI covers all of these.
4. Animate UI's primitive category (Radix / Base UI / Headless UI wrappers)
   is banned. HeroUI primitives plus React Aria cover the same ground with
   consistent theming.
5. Motion effect atoms must wrap HeroUI components rather than replace them.
   For example, a blur-fade entrance wraps a HeroUI `Card`; a digit roll
   replaces only the `<span>` showing the number, not the surrounding
   HeroUI filter bar.
6. Motion effect atoms must honor `prefers-reduced-motion: reduce` and
   render a static fallback when motion is reduced.
7. The only animation runtime dependency is `motion`. No additional Radix /
   Base UI / Headless UI packages are added through Animate UI.
8. Tokens still flow through `src/styles/` (see ADR 0001 and the design
   guard). Motion atoms must consume `--muse-*` tokens and `--muse-ease-*`
   easings for colors and curves; they must not introduce shadcn-style raw
   CSS variables.

## Consequences

- HeroUI remains the accessibility and behavior baseline.
- MuseHub gains a curated, well-scoped motion layer under
  `src/shared/ui/motion/`.
- The design guard grows a new rule set to prevent Animate UI assets from
  leaking into general component code or replacing HeroUI primitives.
- Future Animate UI upgrades are manual copy-paste, per the upstream model.
  Contributors must record the upstream commit hash or version in a file
  header on each ported file to make diffs reviewable.
- A decision to broaden Animate UI's scope beyond motion/icon atoms requires
  a superseding ADR.
- **Bundling note (vite 8 / rolldown, May 2026):** the `motion` runtime is
  inlined into `dist/assets/index-*.js` rather than getting its own chunk.
  A `manualChunks` carve-out was attempted so `scripts/perf-guard.mjs` could
  track motion's cost independently; rolldown's automatic de-duplication
  stops once explicit `manualChunks` is set, and the net result was +5KB
  gzip across the payload (enough to blow the `total-js` budget). The
  carve-out was reverted. Reviewers should treat the main-js budget as the
  proxy for motion's cost until a cheaper split becomes available.

## Current Motion Assets

This section is a living inventory. Update it whenever a motion atom is added,
removed, or repurposed.

> **Tip for agents and reviewers:** the tables below are hand-maintained for
> at-a-glance reading, but the same information can be regenerated from source
> at any time with:
>
> ```
> npm run guard:motion
> npm run guard:motion -- --json
> npm run guard:motion -- --report-only   # don't fail on violations
> ```
>
> `scripts/motion-report.mjs` scans `src/shared/ui/motion/index.ts` for atoms
> and every `src/**/*.{ts,tsx}` file for imports from `@/shared/ui/motion` and
> prints the current atom → consumers map. If the output drifts from the
> tables here, trust the script and update the tables.
>
> The script also enforces three discipline rules derived from this ADR:
> **D1** each atom source must mention "Animate UI" or "animate-ui.com"
> in its first 20 lines (upstream attribution);
> **D2** each atom source must import `useReducedMotion` from `motion/react`
> or reference `prefers-reduced-motion` (honor the user preference);
> **D3** each atom must have an adjacent `<Atom>.test.tsx`.
> Violations cause `npm run guard:motion` to exit non-zero. Run with
> `--report-only` while iterating locally if you need reporting without
> a non-zero exit.
>
> **`npm run guard:motion` is wired into `npm run ci`** (between
> `guard:design` and `test`), so adding a motion atom without
> attribution/reduced-motion/test support fails the pipeline — there is
> no "quiet" path. If a rule needs to change, update this ADR and
> `scripts/motion-report.mjs` together.

### Atoms under `src/shared/ui/motion/`

| Atom              | Purpose                                                                                                    | Reduced-motion fallback                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `BlurFade`        | Entrance fade + slight translate + blur release for hero text and staggered content blocks.                | Renders children as a plain `div` with no animation.                          |
| `Counter`         | Animated number tween for statistics and counts.                                                           | Snaps to the target value immediately.                                        |
| `MotionHighlight` | Measurement-driven sliding indicator that tracks a caller-supplied rect. Used for active rail affordances. | Uses `transition: { duration: 0 }` so the indicator snaps to the target rect. |
| `TypingText`      | One-shot or looping typewriter-style text with optional caret.                                             | Renders the first entry as static text with no caret.                         |
| `PressPulse`      | One-shot scale + opacity pulse overlay triggered by a `triggerKey` change. Used for copy-success feedback. | Renders no overlay.                                                           |

### Representative integration points

| Surface                                                     | Atom(s) used                                                                            |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/pages/home/ui/HomePage.tsx`                            | `BlurFade` for hero copy + orbit card stagger.                                          |
| `src/pages/upload/ui/UploadPage.tsx`                        | `BlurFade` for hero / agent cards / footer; `TypingText` for the CLI-style status line. |
| `src/widgets/app-shell/ui/SideRail.tsx`                     | `MotionHighlight` for the active navigation indicator.                                  |
| `src/widgets/app-shell/ui/AccountSettingsModal.tsx`         | Nested `BlurFade` for Modal body section stagger.                                       |
| `src/features/gallery-wall/ui/GalleryDiscoveryControls.tsx` | `Counter` for the filtered showcase count.                                              |
| `src/features/gallery-wall/ui/GalleryCard.tsx`              | `Counter` for favorites / likes; `PressPulse` for the Copy prompt success state.        |
| `src/features/gallery-wall/ui/GalleryEmptyState.tsx`        | `BlurFade` for the empty-state copy.                                                    |
| `src/shared/ui/PagePlaceholder.tsx`                         | `BlurFade` for placeholder card interior stagger.                                       |

### Adding a new atom

1. Place the source in `src/shared/ui/motion/<Atom>.tsx` with a header declaring
   the Animate UI upstream and the `docs/adr/0002-animate-ui-motion-only.md`
   scope.
2. Add the atom and any exported types to `src/shared/ui/motion/index.ts`.
3. Implement a reduced-motion fallback using `useReducedMotion` from
   `motion/react` or by short-circuiting inside a `useEffect`.
4. Consume MuseHub tokens (`--muse-*`) and easings (`--muse-ease-*`) rather
   than raw colors / curves.
5. Add a unit test under `src/shared/ui/motion/<Atom>.test.tsx` covering at
   minimum: render with props, a11y attributes, and either the reduced-motion
   fallback or a behavior the caller relies on.
6. Update the tables above when wiring the atom into a new surface, or rely
   on `npm run guard:motion` to surface the change.

### Testing caveat: reduced-motion under jsdom

framer-motion (re-exported through `motion/react`) caches the reduced-motion
preference in a module-scoped singleton on first `useReducedMotion()` call.
Replacing `window.matchMedia` in a test therefore does not flip the hook's
return value. Tests that need to exercise the reduced-motion branch should
use `mockReducedMotion(true)` from `@/test/reduced-motion`, which stubs the
hook via `vi.doMock` and dynamic import. See
`src/shared/ui/motion/TypingText.test.tsx` and
`src/shared/ui/motion/PressPulse.test.tsx` for worked examples.

Some atoms have reduced-motion behavior that is not observable under jsdom
(e.g. `BlurFade` / `Counter` / `MotionHighlight`, whose fallbacks differ from
the full-motion branch only through CSS transitions or spring-animated
properties that jsdom does not render). For those, D2 discipline (via
`guard:motion`) is the baseline assurance; a browser-level test would be
required to assert the visual fallback.
