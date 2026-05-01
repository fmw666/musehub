/**
 * Test helper: stub motion's `useReducedMotion` hook so atoms render their
 * reduced-motion fallback branch.
 *
 * Why a mock and not a real matchMedia flip?
 *
 * framer-motion (which `motion/react` re-exports) caches the reduced-motion
 * preference in a module-scoped singleton on first call. Once any earlier
 * test has invoked `useReducedMotion()`, subsequent `window.matchMedia`
 * overrides are ignored for the rest of the test session. Mocking the hook
 * itself sidesteps that singleton and gives each test a clean control of
 * the reduced branch.
 *
 * Usage in a test file:
 *   import { mockReducedMotion, resetReducedMotionMock } from "@/test/reduced-motion";
 *
 *   afterEach(() => resetReducedMotionMock());
 *
 *   it("reduced branch", async () => {
 *     mockReducedMotion(true);
 *     const { Atom } = await import("./Atom");
 *     render(<Atom />);
 *     // assert fallback branch
 *   });
 *
 * The component under test must be imported dynamically AFTER the mock is
 * set up, because `vi.doMock` only affects subsequent imports. Tests that
 * exercise the full-motion branch can keep their top-level static imports.
 */
import type * as MotionReact from "motion/react";
import { vi } from "vitest";

let mocked = false;

export function mockReducedMotion(value: boolean): void {
  vi.resetModules();
  vi.doMock("motion/react", async () => {
    const actual = await vi.importActual<typeof MotionReact>("motion/react");
    return {
      ...actual,
      useReducedMotion: () => value,
    };
  });
  mocked = true;
}

export function resetReducedMotionMock(): void {
  if (!mocked) return;
  vi.doUnmock("motion/react");
  vi.resetModules();
  mocked = false;
}
