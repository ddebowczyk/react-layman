# PR 13: Add a Tauri TypeScript bridge contract

**Depends on:** PRs 07-12

## Goal and outcome

Provide a reference integration for a Tauri React view that persists a layout,
reacts to host events, controls Layman through typed commands, and launches or
focuses modules through the application host.

The outcome is an integration pattern that an upstream maintainer can review
without coupling the core `react-layman` package to Tauri.

## Boundary rule

Layman manages an in-webview layout model and DOM-level floating panels. It
must not create `WebviewWindow` instances, load Tauri plugins, or decide module
permissions. The Tauri application owns native windows, module lifecycle,
commands, permissions, persistence location, and event transport.

Layman emits typed transitions; the app decides whether a transition saves a
workspace or invokes Rust. A module never receives private Layman context.

## Target TypeScript adapter

Place the reference adapter in an example or optional integration package, not
the core runtime. It depends on a small, mockable port:

```ts
interface LayoutSnapshotPort {
  load(workspaceId: string): Promise<LaymanSnapshot | undefined>;
  save(
    workspaceId: string,
    snapshot: LaymanSnapshot,
    revision: number
  ): Promise<void>;
  subscribe?(
    workspaceId: string,
    receive: (update: LayoutUpdate) => void
  ): () => Promise<void>;
}

interface ModuleHost<TModule> {
  open(module: TModule): Promise<void>;
  focus(moduleId: string): Promise<void>;
  close(moduleId: string): Promise<void>;
}
```

The Tauri-specific implementation may wrap `invoke` and `listen`, but the core
types above remain framework-neutral. `ModuleHost` maps a tab's typed module
data to the app's native-window or embedded-module behavior.

## Integration flow

1. The view loads and validates a versioned snapshot through `LayoutSnapshotPort`.
2. It creates a controlled `LaymanController` with the restored state.
3. User interactions dispatch semantic commands. An `onTransition` handler
   saves only applied, durable model changes; resize events may be debounced.
4. Native events call `controller.replaceState` or `controller.dispatch` with
   `origin: "tauri"`. The adapter uses revision and origin IDs to ignore its
   own echoed writes and reject stale updates deterministically.
5. Module launch/focus/close handlers call `ModuleHost` outside Layman. A host
   response updates module data or dispatches a semantic command; it does not
   mutate a React context or a path directly.
6. A native window closing event is handled as an application decision first.
   If approved, the host sends a normal `window.close` or `tab.close` command
   to Layman so the same transition log records it.

## Change scope

1. Add a `docs/integrations/tauri.md` guide and a small type-checked React
   example. The example must show setup, `config`, `components`, `theme`,
   inspection, transition persistence, native-event restore, and a module host.
2. Add an adapter test suite using fake snapshot and module ports. Do not make
   Tauri itself a required development dependency for the core package.
3. Add a production persistence adapter interface to `LaymanView`. It must
   operate on versioned snapshots and be optional; `localStorage` becomes one
   adapter rather than a hidden provider effect.
4. Define error behavior for load, save, migration, and subscribe failures.
   Report typed integration events and retain the last valid state instead of
   silently replacing it.
5. Define a small Tauri application acceptance test separately in the consumer
   app: create a workspace, open a module, move it, restart, restore, and react
   to a native close/focus event. This repository only tests the mockable
   TypeScript contract.

## Tests

Test the reference adapter with fakes for:

- first load, restore, and failed/corrupt snapshot recovery;
- saving only applied transitions and preserving a revision order;
- an event that echoes a local write;
- an external native close/focus event routed through a controller command;
- module launch failure without a layout mutation; and
- two independent workspace IDs with no state or subscription crossover.

Run `npm test`, `npm run lint`, `npm run build:lib`, and type-check the Tauri
example without a native Tauri build. Run the native acceptance scenario in the
consumer application CI where Rust, permissions, and window APIs exist.

## Proposed pull request

**Title:** `docs(example): add a controlled Tauri TypeScript integration contract`

**Why:** A desktop host needs persistence, native events, and module ownership
that a React layout library should not own itself.

**What it solves:** A Tauri view has a tested recipe for setup, configuration,
control, inspection, persistence, and module-window coordination while the core
library stays portable.

**Review boundary:** Framework-neutral adapter contract plus a Tauri example.
No Rust host implementation or native plugin dependency belongs in this PR.
