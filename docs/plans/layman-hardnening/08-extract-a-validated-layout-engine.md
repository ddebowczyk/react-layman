# PR 08: Extract a validated layout engine

**Depends on:** PR 07

## Goal and outcome

Move state transitions and read-only inspection into a React-free TypeScript
engine. The engine must produce structured outcomes for accepted, rejected, and
no-op commands.

The outcome makes the layout testable without DOM or React DnD, and gives a
Tauri TypeScript view a safe way to control and inspect it.

## Target public core

Names are proposed here and should be reviewed as one API surface:

```ts
type LaymanCommand<TData> =
  | {type: "tab.select"; tabId: string}
  | {type: "tab.move"; tabId: string; target: WindowTarget; placement: Placement}
  | {type: "window.move"; windowId: string; target: WindowTarget; placement: Placement}
  | {type: "window.close"; windowId: string}
  | {type: "split.resize"; splitId: string; sizes: readonly number[]};

type LaymanTransition<TData> = {
  command: LaymanCommand<TData>;
  status: "applied" | "noop" | "rejected";
  reason?: LaymanRejectionReason;
  previous: LaymanState<TData>;
  next: LaymanState<TData>;
  changes: readonly LaymanChange[];
};

function applyLaymanCommand<TData>(
  state: LaymanState<TData>,
  command: LaymanCommand<TData>
): LaymanTransition<TData>;

function validateLaymanState<TData>(state: LaymanState<TData>): LaymanValidation;
function inspectLaymanState<TData>(state: LaymanState<TData>): LaymanInspection<TData>;
```

`WindowTarget` must use stable IDs or an explicit root target. It must not be a
public raw array path. `LaymanInspection` is JSON-friendly and includes windows,
tabs, selection, parent/sibling relations, and floating geometry. It must not
return mutable internal arrays.

## Change scope

1. Put pure model, commands, validation, selectors, and serialization in a
   `src/core/` module with no React, browser, or Tauri imports.
2. Adapt the existing reducer to call the engine during the transition period.
   Keep legacy action types at the compatibility edge only.
3. Use a finite rejection reason union, for example `unknown-tab`,
   `unknown-window`, `invalid-target`, `policy-denied`, and `invalid-state`.
   Do not make consumers parse exception text.
4. Make `applyLaymanCommand` immutable and atomic. Rejected and no-op results
   keep `next === previous`.
5. Publish only the intended core types from `src/index.ts`. Keep tree helpers,
   React context setters, and geometry implementation private.

## Tests

Add pure tests for every command/rejection pair, state validation, and stable
inspection output. Add sequence tests for move, close, restore, and resize.
Use a deterministic ID generator in tests. Add one compatibility test that
proves a legacy `LaymanLayoutAction` maps to the same engine transition.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `feat: expose a validated, inspectable Layman state engine`

**Why:** The current public control point is a raw React reducer dispatch mixed
with private UI setters. It cannot say why a command failed or be used outside
a mounted provider.

**What it solves:** A host can test commands in isolation, inspect state with
stable IDs, and log or reject an operation before rendering it.

**Review boundary:** Pure model API and a legacy adapter. Do not add React
controlled props, persistence adapters, or Tauri imports in this PR.
