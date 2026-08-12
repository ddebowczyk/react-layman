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
import {useState} from "react";
import {
    createLaymanNode,
    createLaymanTab,
    createLaymanWindow,
    LaymanView,
    useLaymanController,
    type LaymanComponents,
    type LaymanState,
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
    const [state, setState] = useState<LaymanState>({
        layout: initialLayout,
        floatingWindows: [],
    });
    const controller = useLaymanController({state, onStateChange: setState});
    const components: LaymanComponents = {
        Pane: ({tab}) => <section>{tab.title}</section>,
        Tab: ({tab}) => <>{tab.title}</>,
        Empty: () => <button>Create a window</button>,
    };

    return (
        <div style={{width: 1200, height: 800}}>
            <LaymanView
                controller={controller}
                config={{viewId: "workspace", ariaLabel: "Workspace"}}
                components={components}
            />
        </div>
    );
}
```

The enclosing Layman container must have a defined width and height. This is a
controlled view: the host owns `state` and receives each applied state through
`onStateChange`.

## Window toolbar

`config.toolbar` defines the complete set of tile-frame controls. When it is
present, Layman adds no create, split, maximize, float, close, or overflow
controls of its own. The declared item order is preserved on the toolbar,
overflow menu, and compact menu.

```tsx
import {createLaymanTab, type LaymanToolbarConfig} from "react-layman";

const toolbar: LaymanToolbarConfig<{path: string}> = {
    createTab: () => createLaymanTab("New editor", {path: "/workspace/new.ts"}),
    items: [
        {kind: "builtin", id: "new", action: "tab.create", placement: "bar"},
        {
            kind: "builtin",
            id: "split-right",
            action: "window.split.right",
            placement: "overflow",
        },
        {
            kind: "builtin",
            id: "maximize",
            action: "window.maximize",
            placement: "bar",
        },
        {kind: "builtin", id: "float", action: "window.float", placement: "bar"},
        {kind: "builtin", id: "close", action: "window.close", placement: "bar"},
        {
            kind: "custom",
            id: "module-count",
            placement: "overflow",
            render: ({context}) => <output>{context.window.tabs.length} modules</output>,
        },
    ],
    overflow: "auto",
};

<LaymanView
    controller={controller}
    components={components}
    config={{viewId: "workspace", toolbar}}
/>;
```

Built-in actions are `tab.create`, four `window.split.*` directions,
`window.maximize`, `window.float`, and `window.close`. A create or split
action is disabled unless `createTab` is supplied; Layman never creates a tab
with invented data. Split items are hidden at the configured maximum depth.

Each item can supply `render(props)` to replace the default button. Its props
contain the stable window identity, selected tab, tiled or floating location,
current inspection, active and disabled state, and an `invoke()` function for
the built-in operation. A custom item also receives
`context.dispatch(command)` for its own typed semantic command. It never
receives a tree path or React context setter.

```tsx
{
    kind: "builtin",
    id: "close-with-confirmation",
    action: "window.close",
    render: ({state, invoke}) => (
        <button
            disabled={state.disabled}
            onClick={() => confirm("Close window?") && invoke()}
        >
            {state.label}
        </button>
    ),
}
```

Omit `toolbar` to use the conservative default: maximize, float, and close.

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

## View controller

`LaymanController` is the one API for a Tauri bridge, a host state store, and
the React view. It provides setup, command control, state replacement,
inspection, and transition observation without exposing React context or tree
paths.

```ts
const transition = controller.dispatch(
    {type: "tab.select", tabId: "tab-editor"},
    {origin: "tauri", requestId: "request-42"}
);

const currentState = controller.getState();
const inspection = controller.inspect();

const stopObserving = controller.subscribe((event) => {
    bridge.emit("layman-transition", event);
});

controller.replaceState(restoredState, {origin: "restore"});
stopObserving();
```

Each transition includes the revision, the prior and next state, changed IDs,
the command or replacement kind, origin, request ID, and rejection reason.
`replaceState` rejects invalid state before it reaches the view.

For an isolated local React view, use `defaultState` instead of `state` and
`onStateChange`:

```tsx
const controller = useLaymanController({defaultState: initialState});
```

`LaymanView` accepts only a controller, `LaymanViewConfig`, and
`LaymanComponents`. `components.Pane`, `components.Tab`, and optional
`components.Empty` receive the tab data, selected state, window ID, controller,
and command dispatcher. `config.interaction.canExecute` can reject a UI
command before it changes layout; the controller reports it as `forbidden`.

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
