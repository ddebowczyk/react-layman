# PR 05: Add repeatable component interaction tests

**Depends on:** PR 04

## Goal and outcome

Create a focused browser-component test foundation for Layman. It must test
the rendered view and user interactions without a real browser or Tauri app.

The outcome is a reliable place for later instance-isolation, controlled-view,
theme, and drag tests.

## Change scope

1. Add React Testing Library and `@testing-library/user-event` as development
   dependencies.
2. Add shared test utilities that render a provider and a bounded Layman view
   with deterministic `getBoundingClientRect`, `ResizeObserver`, timers, and
   `crypto.randomUUID` behavior.
3. Give test helpers small builders for tabs, tiled layouts, floating layouts,
   and a capture hook for state transitions. Do not build a second reducer in
   test code.
4. Add component tests for rendering an empty layout, selecting a tab, closing
   a tab, maximizing and restoring a window, and resizing a floating window
   through document mouse events.
5. Keep drag-and-drop simulation out of this PR. The current provider fixes the
   HTML5 backend, so a test backend first needs the production seam in PR 11.

## Test quality rules

- Assert semantic DOM roles, labels, and visible state where possible, not CSS
  class internals alone.
- Use a single shared environment setup from PR 04.
- Test one observable behavior per case. Avoid broad snapshots of geometry.
- Keep pure reducer coverage in reducer tests; do not duplicate it in DOM tests.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `test: add deterministic component interaction harness`

**Why:** The existing tests cover pure helpers but not the provider, rendered
windows, browser observers, or mouse-driven floating controls.

**What it solves:** Future public APIs can be tested from the same TypeScript
view boundary that a Tauri React webview uses.

**Review boundary:** Shared harness and non-DnD interaction coverage only.
Do not redesign public props in this PR.
