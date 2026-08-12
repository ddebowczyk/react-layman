# react-layman

Layman is a React workspace layout for tiled and floating windows. Its public
contract uses stable IDs, JSON-safe state, typed commands, and explicit host
control. The React view does not own persistence, native windows, or module
life cycles.

Version `0.5.0` requires React and React DOM 19. It keeps the controlled-view
API introduced in `0.4.0`. If you use `v0.3.x`, read the
[migration guide](docs/guides/migrate-to-controlled-view.md) before upgrading.

## Install

```sh
npm install react-layman
```

The application must provide `react` and `react-dom` version 19 as peer
dependencies.

Import the bundled stylesheet once in the application entry point:

```ts
import "react-layman/styles.css";
```

## Create a controlled view

The host owns the state. Give every tab, window, and split a stable ID. Tab
data must be JSON-safe.

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

type ModuleData = {moduleId: string};

const editor = createLaymanTab<ModuleData>("Editor", {moduleId: "editor"}, "tab-editor");
const terminal = createLaymanTab<ModuleData>(
    "Terminal",
    {moduleId: "terminal"},
    "tab-terminal"
);
const initialState: LaymanState<ModuleData> = {
    layout: createLaymanNode(
        "row",
        [
            createLaymanWindow([editor], "window-editor"),
            createLaymanWindow([terminal], "window-terminal"),
        ],
        "split-root"
    ),
    floatingWindows: [],
};

const components: LaymanComponents<ModuleData> = {
    Pane: ({tab}) => <section>{tab.data.moduleId}</section>,
    Tab: ({tab}) => <>{tab.title}</>,
    Empty: () => <button>Create a module</button>,
};

export function Workspace() {
    const [state, setState] = useState(initialState);
    const controller = useLaymanController({state, onStateChange: setState});

    return (
        <div style={{width: 1200, height: 800}}>
            <LaymanView
                controller={controller}
                config={{viewId: "workspace", ariaLabel: "Module workspace"}}
                components={components}
            />
        </div>
    );
}
```

The enclosing view must have a defined width and height. Use `defaultState`
with `useLaymanController` only for an isolated local view.

## Control and inspect a workspace

Use the controller for all programmatic changes. It accepts stable IDs, not
render paths. The controller checks policy on each command and publishes all
transitions, including no-ops and rejections.

```ts
const transition = controller.dispatch(
    {type: "tab.select", tabId: "tab-editor"},
    {origin: "tauri", requestId: "agent-select-editor"}
);

if (transition.status === "rejected") console.warn(transition.reason);

const state = controller.getState();
const inspection = controller.inspect();
const stop = controller.subscribe((nextTransition) => {
    sendToAgent({type: "layman-transition", nextTransition});
});
```

`inspect()` returns detached, JSON-friendly data for windows, tabs, splits,
selections, and floating geometry. `applyLaymanCommand` provides the same pure
engine contract outside React.

## Supported entry points

| Need | Public API | Guide |
| --- | --- | --- |
| Create or validate state | `createLayman*`, `validateLaymanState` | [API reference](docs/reference/public-api.md#state-and-engine) |
| Apply an ID-based command | `applyLaymanCommand`, `LaymanCommand` | [API reference](docs/reference/public-api.md#state-and-engine) |
| Render a controlled workspace | `LaymanView`, `useLaymanController` | [controlled view](docs/reference/public-api.md#react-view) |
| Authorize, observe, and inspect | `LaymanController`, `LaymanInteractionPolicy` | [controller](docs/reference/public-api.md#controller-and-policy) |
| Configure tile controls | `LaymanToolbarConfig` | [toolbar](docs/reference/public-api.md#toolbar) |
| Use an existing DnD provider | `LaymanDndConfig` | [drag and drop](docs/reference/public-api.md#drag-and-drop) |
| Scope visual styling | `LaymanTheme`, `LaymanComponents` | [views and themes](docs/reference/public-api.md#react-view) |
| Persist snapshots | `serializeState`, `deserializeState` | [snapshots](docs/reference/public-api.md#snapshots) |
| Bridge a Tauri view | `createLaymanWorkspaceBridge` | [Tauri integration](docs/integrations/tauri.md) |

Only the root package export and `react-layman/styles.css` are public import
paths. Files under `src/`, `lib/`, and any DOM class not documented in the API
reference are private implementation detail.

## Toolbar, DnD, and themes

`config.toolbar` controls the complete tile-frame toolbar. When supplied,
Layman adds no default widgets. Built-in actions are `tab.create`, four
`window.split.*` actions, `window.maximize`, `window.float`, and
`window.close`. Each item can provide `render(props)` to replace its button;
custom items can dispatch typed semantic commands.

For an existing React-DnD provider, set `config.dnd.mode` to `"external"`.
For deterministic tests, use `"manager"` with an injected manager. Otherwise
Layman creates its own HTML5 provider.

`config.theme` changes only that view root. Use a root class and documented
`--layman-*` variables for CSS-owned themes. Do not write Layman variables to
`:root`. `Pane`, `Tab`, `Empty`, and `ToolbarFrame` are semantic visual slots.
The [API reference](docs/reference/public-api.md) defines their contracts and
the stable `data-layman-*` inspection attributes.

## Persistence and Tauri

`serializeState` emits snapshot schema version `2`; `deserializeState` accepts
only that exact schema. It rejects malformed or older data before the layout
engine sees it. A host must migrate its own older data before calling Layman.

For Tauri, use the framework-neutral workspace bridge. The app provides
versioned snapshot storage and native module operations. Layman owns only
layout state and transitions. The bridge offers `inspect`, `dispatch`,
`replaceState`, and event subscription for an external agent or live host.
See the [Tauri TypeScript integration guide](docs/integrations/tauri.md).

## Release checks

```sh
npm ci
npm test
npm run lint
npm run build:lib
npm run typecheck:consumer
npm run typecheck:tauri-example
npm run check:package
```

The package-consumer fixture imports every documented root export from emitted
declarations. `check:package` verifies the packed declaration and stylesheet
files. See [the 0.5.0 release notes](docs/releases/0.5.0.md) for the final
native-app acceptance gate.

## License

[MIT](LICENSE)
