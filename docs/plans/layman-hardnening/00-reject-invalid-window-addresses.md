# PR 00: Reject invalid window addresses

**Depends on:** nothing

## Goal and outcome

Make `removeWindow` safe when a caller sends a stale or invalid tiled path.
An invalid command must leave the state unchanged. A valid root address (`[]`)
must still remove the root window.

The outcome is a small, reviewable defect repair. It creates the first rule for
all later public commands: rejected input has no partial effect.

## Confirmed problem

`treeRemoveWindow` in `src/LaymanReducer.ts` treats any path whose parent is
not a split node as a root deletion. For a one-window layout,
`{type: "removeWindow", path: [99]}` therefore returns `undefined` and deletes
the root. A stale path from an asynchronous host, a drag operation, or a Tauri
view can erase the layout.

The current reducer probe reproduces this failure.

## Change scope

1. Add a small path-resolution helper that distinguishes these three cases:
   valid root window, valid nested window, and invalid address.
2. In `treeRemoveWindow`, delete the root only when `path.length === 0` and the
   root is a window.
3. Return the original layout reference for a negative, out-of-range, or
   split-node path. Do not rescale siblings on a rejected path.
4. Keep the existing action type and public behavior for valid paths. This PR
   must not introduce stable IDs or the later controller API.

## Regression tests

Add reducer tests for:

- valid removal of the root window;
- `[99]`, `[-2]`, and a nested stale path against a root window;
- an out-of-range child index in a split, including proof that percentages do
  not change; and
- an unknown floating window address, which remains a no-op.

For every rejected case, assert referential equality with the input state. It
makes the no-op contract visible to controlled React callers.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `fix: reject invalid removeWindow paths before mutating layout`

**Why:** Layout paths can be stale after a structural change. Treating one as a
root address can delete user work.

**What it solves:** It makes a command from the UI, a test, or a future Tauri
TypeScript controller fail safely instead of mutating a different window.

**Review boundary:** Only address validation for `removeWindow` and its tests.
Do not combine this PR with move logic or a public API redesign.
