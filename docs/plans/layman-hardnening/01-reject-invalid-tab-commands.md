# PR 01: Reject invalid tab commands

**Depends on:** PR 00

## Goal and outcome

Give `selectTab` and `removeTab` a reliable tab-membership rule: a command may
change a window only when that window contains the requested tab ID.

The outcome is valid selection indices and no surprise mutations from stale
tab objects. This is important when a Tauri view receives an event after its
layout has changed.

## Confirmed problems

`treeSelectTab` writes `findIndex(...)` directly. An unknown tab produces
`selectedIndex: -1`. `treeRemoveTab` filters by ID, but calculates the removed
index with object identity (`indexOf(tab)`). If the ID is absent, `-1` can still
decrement the selection. The floating-window variants have the same two
patterns.

The existing README says an absent tab is a no-op, but the reducer currently
does not meet that contract.

## Change scope

1. Resolve a tab once with `findIndex((candidate) => candidate.id === tab.id)`.
2. Return the original state when the ID is absent, for tiled and floating
   windows.
3. Use the resolved index, not caller object identity, when selection must
   move after a removal.
4. Preserve the selected tab where possible and clamp selection only for a
   successful removal. Do not add new selection semantics in this PR.
5. Keep `TabData` and positional addresses unchanged. Stable data-model IDs
   arrive in PR 07.

## Regression tests

Add tests for tiled and floating windows that prove:

- selecting an unknown ID is a same-reference no-op;
- removing an unknown ID is a same-reference no-op and preserves selection;
- a separately constructed object with the same ID removes the stored tab and
  adjusts selection correctly; and
- a selected last tab remains within bounds after a valid removal.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `fix: make unknown tab commands no-ops`

**Why:** The present reducer accepts caller-owned tab objects but mixes ID and
object-identity comparison. That permits invalid selection state.

**What it solves:** External TypeScript code can issue a tab command by stable
tab ID without a stale object changing the wrong selection.

**Review boundary:** Only tab membership and selection correctness in existing
tree and floating actions. Do not add a controller or change persistence here.
