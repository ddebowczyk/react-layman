# Migrate from v0.3 to the controlled view

Layman `0.4.0` replaces the `v0.3.x` provider, context, mutable tree, and
path-based APIs. This is an intentional breaking change. There are no
deprecated exports, aliases, compatibility adapters, or automatic snapshot
migration in `0.4.0`.

Use the old release only while you complete this migration. Do not import
private files to preserve the old integration.

## Map the old concepts

<!-- markdownlint-disable MD013 -->

| v0.3 concept | v0.4 replacement | Reason |
| --- | --- | --- |
| `LaymanProvider` and `Layman` | `useLaymanController` and `LaymanView` | The host owns state and rendering is explicit. |
| `initialLayout` prop | `LaymanState` passed to the controller | State includes tiled and floating windows. |
| `TabData` class | `LaymanTab` or `createLaymanTab` | Tab data is JSON-safe, immutable input. |
| `LaymanPath` and `WindowAddress` | Stable tab, window, and split IDs | Paths change when the tree changes. |
| `layoutDispatch` from React context | `controller.dispatch(command, meta)` | Commands are authorized, observable, and typed. |
| `storageKey` | Application snapshot port | The app owns persistence, conflicts, and data retention. |
| Global Layman CSS variables | `config.theme` or a view root class | Themes are isolated per view. |
| `mutable`, `toolbarButtons` | `LaymanInteractionPolicy`, `LaymanToolbarConfig` | Permission and visual controls are separate. |
| `LaymanContext`, `WindowContext` | Controller and documented component slots | No React context is a public control boundary. |

<!-- markdownlint-enable MD013 -->

## Replace the provider

This simplified v0.3 pattern coupled persistence, rendering, and mutation in
one provider:

```tsx
import {Layman, LaymanProvider, TabData} from "react-layman";

const firstTab = new TabData("Editor", {path: "/workspace/main.ts"});
const initialLayout = {tabs: [firstTab]};

export function Workspace() {
    return (
        <LaymanProvider
            initialLayout={initialLayout}
            renderPane={(tab) => <Editor path={tab.options.path as string} />}
            renderTab={(tab) => tab.name}
            renderNull={<button>Create a tab</button>}
            storageKey="workspace"
        >
            <Layman />
        </LaymanProvider>
    );
}
```

Replace it with a controlled state and a public controller:

```tsx
import {useState} from "react";
import {
    createLaymanTab,
    createLaymanWindow,
    LaymanView,
    useLaymanController,
    type LaymanComponents,
    type LaymanState,
} from "react-layman";

type ModuleData = {path: string};

const initialState: LaymanState<ModuleData> = {
    layout: createLaymanWindow(
        [createLaymanTab("Editor", {path: "/workspace/main.ts"}, "tab-editor")],
        "window-editor"
    ),
    floatingWindows: [],
};

const components: LaymanComponents<ModuleData> = {
    Pane: ({tab}) => <Editor path={tab.data.path} />,
    Tab: ({tab}) => <>{tab.title}</>,
    Empty: () => <button>Create a tab</button>,
};

export function Workspace() {
    const [state, setState] = useState(initialState);
    const controller = useLaymanController({state, onStateChange: setState});

    return (
        <LaymanView
            controller={controller}
            config={{viewId: "workspace"}}
            components={components}
        />
    );
}
```

Give the parent of `LaymanView` a definite width and height. The view will not
guess a layout size.

## Replace path and reducer actions

Do not retain a `LaymanPath` in application state. Inspect the current state
when an application needs to discover a window, then send a command with its
stable ID.

```ts
const inspection = controller.inspect();
const editor = inspection.windows.find((window) => window.id === "window-editor");

if (editor) {
    controller.dispatch(
        {
            type: "window.move",
            windowId: "window-terminal",
            target: {kind: "window", windowId: editor.id},
            placement: "right",
        },
        {origin: "tauri", requestId: "move-terminal"}
    );
}
```

Use `controller.subscribe` for transition observation. A transition reports
the status, revision, changed IDs, prior and next state, command metadata, and
a rejection or policy-denial reason when applicable.

## Move persistence into the application

The v0.3 `storageKey` used browser persistence inside the provider. In v0.4,
the application owns storage. For a plain React host, store the result of
`serializeState(state)` in your own data layer. Restore it with
`deserializeState(snapshot)` before initializing the controller.

For Tauri, implement `LaymanSnapshotPort` and use
`createLaymanWorkspaceBridge`. The port atomically compare-and-saves a revision
and returns its current record on conflict; Layman restores that record without
retrying or merging it. The [Tauri integration guide](../integrations/tauri.md)
has the complete port contract.

## Migrate persisted data deliberately

The current serialized state has `schemaVersion: 2`. `deserializeState`
accepts only this exact schema and rejects unknown or malformed fields. It does
not convert a v0.3 layout, which had index selection and path addresses rather
than durable IDs.

Write a one-time application migration that creates a fresh v2 state:

1. Assign a unique stable ID to each tab, window, and split.
2. Move tab options into JSON-safe `tab.data` and the displayed name into
   `tab.title`.
3. Replace selected indexes with `selectedTabId` or `null` for an empty
   window.
4. Normalize floating geometry to finite `top`, `left`, `width`, and `height`
   values, and provide a finite `zIndex`.
5. Validate the result with `validateLaymanState`, then persist
   `serializeState(result)`.

Keep that migration in the application. The package intentionally does not
ship a legacy-data reader.

## Replace global styling and toolbar controls

Set `config.theme` for token values or add a class to `LaymanView` and set
documented `--layman-*` variables on that class. Do not set them on `:root`.
This prevents one workspace from changing another workspace's geometry.

Use `LaymanToolbarConfig.items` to define every tile-frame widget. A toolbar
item may replace its built-in button with `render(props)`. For access rules,
use `LaymanInteractionPolicy`; a policy deny result controls toolbar, drag,
custom widget, controller, Tauri, and agent commands at the same boundary.

## Verify the migration

Run the package checks, then test the application flow that opens modules,
restores a workspace, applies an external update, denies a protected command,
and closes a native window. See the [release notes](../releases/0.4.0.md) for
the required final gate.
