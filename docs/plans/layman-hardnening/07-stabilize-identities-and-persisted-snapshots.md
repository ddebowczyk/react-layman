# PR 07: Stabilize identities and persisted snapshots

**Depends on:** PR 06

## Goal and outcome

Give every tab and window a stable, serializable identity. A tree path must be
treated as a temporary rendering location, not an external address.

The outcome lets a Tauri TypeScript view keep a reliable link between a layout
tab, a module instance, persisted workspace data, and a native-window event.

## Current limitation

Tiled windows have no ID. They are addressed by paths such as `[0, 1]`, which
change whenever a sibling is removed or a split is flattened. Tiled tab IDs are
also discarded by `Serializer.tsx` and regenerated on restore, while floating
window IDs survive. This prevents a host from safely correlate state across a
save, reload, or native event.

## Change scope

1. Define structural public data types, parameterized by module data:

   ```ts
   interface LaymanTab<TData = unknown> {
     id: string;
     title: string;
     data: TData;
   }

   interface LaymanWindow<TData = unknown> {
     id: string;
     tabs: readonly LaymanTab<TData>[];
     selectedTabId: string;
     viewPercent?: number;
   }
   ```

2. Use one window-ID namespace for tiled and floating windows. A location field
   says whether the window is tiled or floating; it is not the identity.
3. Add `schemaVersion` to persisted snapshots. Serialize tab IDs, window IDs,
   selected tab IDs, floating geometry, and only JSON-compatible module data.
4. Provide a pure migration from the current snapshot shape. It creates IDs
   once, validates the result, and writes the new version on the next save.
5. Retain `TabData`, `name`, `options`, and index-based selection as deprecated
   compatibility adapters for one documented transition release. Do not make a
   breaking rename invisible.
6. Do not expose a path as a future command target. Rendering may still use a
   private path while the tree implementation is being migrated.

## Regression tests

Add deterministic tests that verify:

- serialize then deserialize preserves every tab and window ID;
- tiled and floating windows round-trip with the same schema version;
- a legacy snapshot migrates once into a valid current snapshot;
- duplicate IDs and an unknown selected tab ID are rejected by validation; and
- a tree rearrangement changes its render path but not its window or tab IDs.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `feat: add stable layout identities and versioned snapshots`

**Why:** Paths are implementation positions, not durable application identity.

**What it solves:** A Tauri view can persist a workspace, restore it, and route
module or native-window events to the same layout item without path guessing.

**Review boundary:** Data model and serialization migration only. Typed
commands and React view APIs arrive after the model is stable.
