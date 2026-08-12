# PR 02: Make tab moves atomic

**Depends on:** PR 01

## Goal and outcome

Make `moveTab` transactional. It must either move the stored source tab to a
valid destination or leave the complete state unchanged.

The outcome protects module tabs when a drag target disappears, when a Tauri
host sends an old destination, or when a command contains a stale tab payload.

## Confirmed problems

`moveTab` removes the source before it validates `newPath`. Moving a tab from
`[0]` to `[99]` can collapse the source branch and lose the tab. It also inserts
`action.tab`, rather than the tab found in the source state, so a caller can
replace tab metadata while retaining its ID.

## Change scope

1. Read and validate source, source tab ID, destination, placement, and depth
   limits against the input state before making a structural change.
2. Treat the tab found in the source state as authoritative. The action only
   identifies it by ID; it must not replace its title or metadata.
3. Represent an external source explicitly in the internal helper rather than
   relying on a magic `[-1]` path. Keep the public sentinel temporarily for
   compatibility and mark it for replacement in PR 08.
4. Apply the removal and insertion as one logical transformation. Resolve the
   destination after source collapse or use a pre-resolved target so a valid
   sibling target is not lost when paths shift.
5. Define self-target behavior: a center move to the same window is a no-op;
   an edge move has an explicit, tested split result or is rejected. Do not
   leave it dependent on incidental path adjustment.
6. Return the original state reference for every rejected command.

## Regression tests

Test tree-to-tree, tree-to-floating, floating-to-tree, and external-source
moves. Include:

- an invalid target that preserves the source tree exactly;
- a source branch that collapses while the destination remains valid;
- a missing source tab;
- an existing floating target and a missing floating target; and
- a forged tab object with the source ID, proving the stored object moves.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `fix: make moveTab validate before committing source removal`

**Why:** A drag or external command can observe a layout just before another
transition changes it.

**What it solves:** A rejected destination cannot delete a module tab, and a
controller cannot inject stale tab data during a move.

**Review boundary:** Tab movement only. Window movement has different tree and
floating rules and belongs in PR 03.
