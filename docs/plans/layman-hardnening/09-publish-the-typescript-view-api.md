# PR 09: Publish the TypeScript view API

**Depends on:** PR 08

## Goal and outcome

Publish one clear TypeScript contract for a React host to set up, configure,
control, inspect, and customize a Layman view. This is the primary API for the
Tauri TypeScript view layer.

The outcome removes the need for a consumer to import `LaymanContext`, call a
raw reducer dispatch, or know tree paths.

## Target API contract

The new facade should be the documented entry point. Exact names can change in
review, but all six roles below must remain explicit.

```tsx
const controller = useLaymanController<ModuleDescriptor>({
  state,
  onStateChange: setState,
  onTransition: recordTransition,
});

<LaymanView
  controller={controller}
  config={{
    viewId: "workspace-main",
    ariaLabel: "Workspace layout",
    maxDepth: 4,
    showTabs: true,
    interaction: {canExecute: allowWorkspaceCommand},
    toolbar: {items: workspaceToolbarItems, overflow: "auto"},
  }}
  components={{Pane: ModulePane, Tab: ModuleTab, Empty: EmptyWorkspace}}
  theme={workspaceTheme}
  dnd={{mode: "internal"}}
/>
```

The related public types should have these responsibilities:

```ts
interface LaymanController<TData> {
  dispatch(command: LaymanCommand<TData>, meta?: LaymanCommandMeta): LaymanTransition<TData>;
  replaceState(state: LaymanState<TData>, meta?: LaymanCommandMeta): LaymanTransition<TData>;
  getState(): Readonly<LaymanState<TData>>;
  inspect(options?: LaymanInspectOptions): LaymanInspection<TData>;
  subscribe(listener: (transition: LaymanTransition<TData>) => void): () => void;
}

interface LaymanViewConfig<TData> {
  viewId: string;
  ariaLabel?: string;
  maxDepth?: number;
  showTabs?: boolean;
  minPaneSize?: number;
  interaction?: LaymanInteractionPolicy<TData>;
  toolbar?: LaymanToolbarConfig<TData>;
}

interface LaymanComponents<TData> {
  Pane: React.ComponentType<LaymanPaneProps<TData>>;
  Tab: React.ComponentType<LaymanTabProps<TData>>;
  Empty?: React.ComponentType<LaymanEmptyProps<TData>>;
  ToolbarActions?: React.ComponentType<LaymanToolbarActionProps<TData>>;
}
```

`LaymanPaneProps` and `LaymanTabProps` must include the typed tab, window ID,
selected state, and a restricted `controller`/command callback. They must not
leak mutable context setters or positional paths.

`LaymanToolbarConfig` is an authoritative, host-owned top-bar widget contract.
PR 10 defines its built-in action registry, custom render context, overflow
behavior, full-widget replacement rules, and legacy `toolbarButtons` migration.

## Ownership rules

1. The host owns controlled `state`. `useLaymanController` always reads the
   latest supplied state and requests a commit through `onStateChange`.
2. A supported uncontrolled form may use `defaultState`, but it must expose the
   same transition and inspection contract. It is for simple demos, not the
   recommended Tauri integration.
3. A command has an `origin` such as `user`, `host`, `restore`, or `tauri`.
   Transition callbacks receive the origin, command, status, reason, stable
   state revision, and semantic changes.
4. `getState`, `inspect`, and `subscribe` are the supported observation path.
   DOM scraping, React context access, and reducer internals are not APIs.
5. The legacy `LaymanProvider` plus `Layman` pair remains as a documented
   adapter for one transition release. Its types receive deprecation notices
   that point to `LaymanView`.

## Implementation scope

1. Implement the controller with `useSyncExternalStore`-safe subscription
   behavior so imperative callers and React see the same committed state.
2. Render `LaymanView` from a controller and pass only typed view data to slots.
3. Define controlled/uncontrolled precedence and warn in development if callers
   mix `state` with `defaultState` or `initialLayout`.
4. Export the full public type surface and add an `exports` map so TypeScript
   consumers do not import private source paths.
5. Add a type-checked example that models a `ModuleDescriptor` used by a Tauri
   view. Its module data should remain typed from setup through pane rendering.

## Tests

Add component and type tests that prove a host can:

- initialize a controlled view;
- issue a command and receive one applied, no-op, or rejected transition;
- replace state from an external event;
- inspect selected tabs and floating windows without DOM access;
- subscribe and unsubscribe without stale state; and
- render typed pane, tab, empty, and toolbar slots.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `feat: add controlled and inspectable TypeScript view API`

**Why:** A Tauri React view needs a deliberate application boundary, not
access to private context fields such as `layoutDispatch` and drag state.

**What it solves:** The host has an explicit setup/configure/control/inspect
contract. It can manage module state, capture transitions, and render its own
components with typed data.

**Review boundary:** Public React/controller API only, backed by the core engine.
Toolbar implementation, persistence, DnD injection, themes, and Tauri transport
stay separate.
