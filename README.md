# react-layman

Layman is a React layout workspace with tiled and floating windows, tabs, and
drag-and-drop interactions. Its layout engine is pure TypeScript: hosts can
inspect a complete JSON-safe state, apply stable-ID commands, and decide how
to render the result.

The included React layer renders the engine and issues the same commands that
an external host can use.

## Install

```bash
npm install react-layman
```

For local development:

```bash
npm install
npm run dev
```

## React setup

Create every tab, window, and split with a stable ID. Tab data must be
JSON-safe so it can cross a host boundary and persist safely.

```tsx
import {
    createLaymanNode,
    createLaymanTab,
    createLaymanWindow,
    Layman,
    LaymanProvider,
    type LaymanTab,
} from "react-layman";

const editor = createLaymanTab("Editor", {path: "/workspace/main.ts"}, "tab-editor");
const terminal = createLaymanTab("Terminal", {cwd: "/workspace"}, "tab-terminal");

const initialLayout = createLaymanNode(
    "row",
    [
        createLaymanWindow([editor], "window-editor"),
        createLaymanWindow([terminal], "window-terminal"),
    ],
    "split-root"
);

export function Workspace() {
    const renderPane = (tab: LaymanTab) => <section>{tab.title}</section>;
    const renderTab = (tab: LaymanTab) => tab.title;

    return (
        <LaymanProvider
            initialLayout={initialLayout}
            renderPane={renderPane}
            renderTab={renderTab}
            renderNull={<button>Create a window</button>}
            mutable
        >
            <div style={{width: 1200, height: 800}}>
                <Layman />
            </div>
        </LaymanProvider>
    );
}
```

The Layman container must have a defined width and height.

## Layout model

The model has three durable entity types:

```ts
type LaymanTab = {
    id: string;
    title: string;
    data: JsonValue;
};

type LaymanWindow = {
    id: string;
    tabs: readonly LaymanTab[];
    selectedTabId: string | null;
    viewPercent?: number;
};

type LaymanNode = {
    id: string;
    direction: "row" | "column";
    children: readonly [LaymanTree, LaymanTree, ...LaymanTree[]];
    viewPercent?: number;
};
```

Every tab ID is unique across the state. Window and split IDs share one layout
namespace. A state also has `floatingWindows`, each with stable tab selection,
finite geometry, and z-index.

## Engine API

Use `applyLaymanCommand` in a host, state store, or bridge. It never mutates
its input. An applied transition has a new state; a rejected command and a
no-op keep the exact state reference.

```ts
import {
    applyLaymanCommand,
    inspectLaymanState,
    type LaymanCommand,
    type LaymanState,
} from "react-layman";

function dispatch(state: LaymanState, command: LaymanCommand) {
    const transition = applyLaymanCommand(state, command);
    if (transition.status === "rejected") {
        console.warn("Layman command rejected", transition.reason);
    }
    return transition.next;
}

const view = inspectLaymanState(state);
```

`inspectLaymanState` returns detached JSON-friendly objects. It reports the
root ID, every tiled and floating window, tabs, selected tab, split parentage,
sibling IDs, and floating geometry. It is safe to send this value through a
Tauri event or invoke response.

### Commands

Commands use stable IDs. Render paths are internal implementation details and
are not part of the engine API.

```ts
type LaymanCommand =
    | {
          type: "tab.insert";
          tab: LaymanTab;
          target: WindowTarget;
          placement: LaymanPlacement;
          windowId?: string;
      }
    | {
          type: "tab.move";
          tabId: string;
          target: WindowTarget;
          placement: LaymanPlacement;
          windowId?: string;
      }
    | {type: "tab.remove"; tabId: string}
    | {type: "tab.select"; tabId: string}
    | {
          type: "window.move";
          windowId: string;
          target: WindowMoveTarget;
          placement: LaymanPlacement;
      }
    | {type: "window.close"; windowId: string}
    | {
          type: "split.resize";
          splitId: string;
          index: number;
          leadingPercent: number;
      }
    | {type: "layout.autoArrange"}
    | {type: "floating.position"; windowId: string; position: Position}
    | {type: "floating.focus"; windowId: string};

type WindowTarget = {kind: "root"} | {kind: "window"; windowId: string};
type WindowMoveTarget = WindowTarget | {kind: "floating"; position: Position};
type LaymanPlacement = "top" | "bottom" | "left" | "right" | "center";
```

For example, a host can move an existing window beside a known target without
inspecting tree positions:

```ts
const transition = applyLaymanCommand(state, {
    type: "window.move",
    windowId: "window-terminal",
    target: {kind: "window", windowId: "window-editor"},
    placement: "bottom",
});
```

`LaymanTransition` has `status`, `reason` for a rejection, the previous and
next state, and the IDs changed by the operation. `validateLaymanState`
validates a complete state before a host accepts it.

## Snapshots

`serializeState` and `deserializeState` use one exact snapshot format: schema
version `2`. Snapshots contain only durable IDs, selections, JSON tab data,
tiled tree structure, and floating-window geometry. Invalid snapshots throw
before they reach the engine.

```ts
const snapshot = serializeState(state);
const restored = deserializeState(snapshot);
```

## React controls

`LaymanProvider` exposes `layoutDispatch` through `LaymanContext`. It accepts
the same `LaymanCommand` union as the engine. The current built-in toolbar
controls can be selected with `toolbarButtons`; the next API layer will make
each tile control independently configurable.

```tsx
<LaymanProvider
    initialLayout={initialLayout}
    renderPane={renderPane}
    renderTab={renderTab}
    renderNull={<EmptyWorkspace />}
    toolbarButtons={["splitBottom", "splitRight", "maximize", "float"]}
>
    <Layman />
</LaymanProvider>
```

## Theme

Layman applies its default CSS automatically. Override its CSS variables in
your application. See [`styles/example-theme.css`](styles/example-theme.css)
for the available values.

## Quality checks

```bash
npm test
npm run lint
npm run build:lib
npm run build:demo
```

## License

[MIT](LICENSE)
