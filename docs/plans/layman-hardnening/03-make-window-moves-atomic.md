# PR 03: Make window moves atomic

**Depends on:** PR 00

## Goal and outcome

Make `moveWindow` validate both ends and move the window that exists in the
state, not a caller-provided copy.

The outcome prevents an invalid docking operation from deleting a group of
modules or replacing it with unrelated tabs.

## Confirmed problem

`moveWindow` removes the source before it proves that the tiled destination is
valid. A source at `[0]` moved to `[99]` changes the layout. It also uses
`action.window` after it has found the source, so a stale payload can replace
the source window's contents.

## Change scope

1. Resolve the source window and destination against the original state.
2. Reject invalid paths, destinations inside the source subtree, unsupported
   placements, and a new floating ID without a position before source removal.
3. Use the resolved source window as the only content that can be moved. Keep
   `action.window` for compatibility only during this PR; ignore it after a
   source resolves and mark it deprecated in the type documentation.
4. Apply source removal, path adjustment, and destination insertion through a
   single internal operation. A rejected result must preserve the input state
   reference.
5. Retain valid tiled-to-tiled, tiled-to-floating, floating-to-tiled, and
   floating-to-floating behavior.

## Regression tests

Add tests for:

- invalid tiled and floating destinations that preserve source and target;
- a stale `action.window` whose tabs differ from the source;
- source removal that changes sibling indices;
- a successful new floating window with a valid initial position; and
- a rejected new floating window without a position.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `fix: make moveWindow source-authoritative and atomic`

**Why:** Whole-window drags change the tree more than tab drags. They must not
commit an intermediate state that another view can observe.

**What it solves:** A future Tauri controller can safely retry or reject a
docking command without lost module groups or forged window contents.

**Review boundary:** Whole-window transfer correctness only. Stable window IDs
and the external command API remain later work.
