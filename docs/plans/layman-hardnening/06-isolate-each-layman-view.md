# PR 06: Isolate each Layman view

**Depends on:** PR 05

## Goal and outcome

Allow more than one Layman view on a page without shared DOM targets, global
style reads, or observer churn.

The outcome lets a Tauri TypeScript shell render separate workspaces, previews,
or module areas safely in the same webview.

## Current coupling

`LaymanContext` renders a fixed `id="drag-window-border"`. `Window` finds that
element with `document.getElementById`, so multiple providers create duplicate
IDs and all drag borders can use the first instance. Several components also
read CSS variables from `document.documentElement`. The `ResizeObserver` effect
re-subscribes whenever it updates the measured size.

## Change scope

1. Replace the fixed portal ID with an instance-owned ref passed through a
   private render context. Never search the global document for a Layman-owned
   element.
2. Add a required-or-generated `viewId` and render it as
   `data-layman-view`. Use it for diagnostics, test selection, and DOM
   isolation; it is not yet the future stable layout state ID.
3. Move measurement and style-token reads behind root-scoped helpers. They must
   read from the specific Layman root, not `document.documentElement`.
4. Correct the observer lifecycle so it subscribes once per root and disconnects
   on unmount, without re-subscribing to its own size updates.
5. Expose no new raw DOM handles. Later inspection must use typed selectors,
   not DOM scraping.

## Regression tests

Render two views with different rects and themes. Prove that:

- each view owns its portal/border layer;
- resizing one does not change the other view's calculated rects;
- unmount disconnects only its observer; and
- no duplicate fixed ID exists in the document.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `fix: scope portal and measurements to each Layman view`

**Why:** The implementation assumes one global layout root, but an application
shell often contains more than one React surface.

**What it solves:** Layout views become safe to mount, test, inspect, and theme
independently in a Tauri TypeScript UI.

**Review boundary:** Instance isolation and lifecycle correctness only. The
typed theme and controller contracts follow in later PRs.
