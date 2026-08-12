# Tauri TypeScript view integration

Layman manages a layout inside one webview. Your Tauri application owns native
windows, module permissions, lifecycle decisions, event transport, and durable
storage. Layman does not import Tauri, create `WebviewWindow` objects, or call
plugins.

The public `createLaymanWorkspaceBridge` connects one controller to two
application-owned ports:

- `LaymanSnapshotPort` loads, compare-and-saves, and subscribes to snapshots.
- `LaymanModuleHost` opens, focuses, and closes native or embedded modules.

The bridge gives the view layer one typed setup, inspection, and control API.
It serializes applied local transitions in confirmation order, ignores echoed
writes, and rejects stale or invalid remote snapshots without replacing the
last valid layout.

## Define the Tauri ports

Use your application's `invoke` and `listen` functions. The reference mapping
in [`examples/tauri/ports.ts`](../../examples/tauri/ports.ts) has no Tauri
package dependency, so it is type-checked in this repository.

```ts
const snapshots = createTauriSnapshotPort(invoke, listen);
const modules = createTauriModuleHost<ModuleData>(invoke);
```

Your Rust commands receive these values:

```ts
type LaymanWorkspaceUpdate = {
    revision: number;
    originId: string;
    snapshot: LaymanSerializedState;
};
```

`snapshot` is the exact versioned value from `serializeState`. A save request
contains the last confirmed `expectedRevision`; `0` means no stored record.
Storage must perform compare-and-save atomically:

```ts
type LaymanSnapshotSaveRequest = {
    expectedRevision: number;
    originId: string;
    snapshot: LaymanSerializedState;
};

type LaymanSnapshotSaveResult =
    | {status: "saved"; update: LaymanWorkspaceUpdate}
    | {status: "conflict"; current: LaymanWorkspaceUpdate};
```

On `saved`, the record revision must be greater than `expectedRevision` and
the origin must match the request. On `conflict`, return the current record;
do not throw a normal revision conflict. The bridge replaces its local layout
with that record, cancels queued writes from the rejected layout, and emits
`save-conflicted`. It does not retry or merge snapshots. The application owns
any explicit conflict-resolution policy.

A `conflict` must always contain a valid current record. Do not delete an
active workspace record between CAS operations. Model a cleared layout as a
new valid snapshot with the next revision. If a host cannot provide a current
record after deletion, fail the port operation instead of returning `conflict`.

Use a new, stable `originId` for each mounted view, for example
`useRef(crypto.randomUUID()).current`. The same ID identifies an echoed save
event and lets the bridge ignore it.

## Mount a workspace view

The reference `useTauriWorkspace` hook starts and stops the bridge. Remount the
component to change workspace, origin, persistence port, or module host.

```tsx
const originId = useRef(crypto.randomUUID()).current;
const bridge = useTauriWorkspace({
    workspaceId: "project:alpha",
    originId,
    initialState: {layout: undefined, floatingWindows: []},
    snapshots,
    modules,
});

useEffect(() =>
    bridge.subscribe((event) => {
        agentBridge.emit("layman-event", {
            event,
            inspection: bridge.inspect(),
        });
    }), [bridge]);

return (
    <LaymanView
        controller={bridge.controller}
        config={{
            viewId: "project-alpha",
            maxDepth: 4,
            toolbar,
            theme: {
                toolbarHeight: 36,
                toolbarBackground: "#172033",
                windowBackground: "#202c44",
                accentColor: "#60a5fa",
            },
        }}
        components={{
            Pane: ModulePane,
            Tab: ModuleTab,
            Empty: EmptyWorkspace,
            ToolbarFrame: WorkspaceToolbarFrame,
        }}
    />
);
```

`LaymanView` remains a rendering boundary. The bridge owns persistence and
external control; the controller remains the only layout command boundary.

## Inspect and control the layout

Use the bridge for external clients such as an agent API. It exposes a detached
inspection plus the exact snapshot and the current application revision.

```ts
const current = bridge.inspect();
// current.workspaceId, current.revision, current.layout, current.snapshot

const move = bridge.dispatch(
    {
        type: "window.move",
        windowId: "terminal-window",
        target: {kind: "window", windowId: "editor-window"},
        placement: "right",
    },
    "agent-request-42"
);

if (move.status === "rejected") {
    agentBridge.emit("layman-command-rejected", move);
}
```

`dispatch` and `replaceState` set the command origin to `tauri`. Direct user
actions from `LaymanView` retain the `user` origin. Both produce controller
transitions and persist only when they are applied. Call `flush()` before an
ordered application shutdown when pending saves must complete.

The host may send a newer `LaymanWorkspaceUpdate` to `bridge.receive(update)`.
The bridge validates the snapshot, applies it with the `restore` origin, and
does not save it again. It emits `external-update-applied`,
`external-update-ignored`, or `external-update-failed` so the agent bridge can
report an exact result.

## Native module lifecycle

Module calls never mutate a Layman layout by themselves:

```ts
const opened = await bridge.openModule({kind: "terminal", moduleId: "shell-1"});
if (opened) {
    bridge.dispatch({
        type: "tab.insert",
        tab: {
            id: "shell-1",
            title: "Shell",
            data: {kind: "terminal", moduleId: "shell-1"},
        },
        target: {kind: "root"},
        placement: "center",
        windowId: "terminal-window",
    });
}
```

When a native window requests close, the application first makes its permission
and lifecycle decision. If it accepts, send a normal semantic command:

```ts
bridge.dispatch({type: "window.close", windowId: "terminal-window"}, "native-close-17");
```

The same transition log then records UI, agent, and native requests. A failed
module call emits `module-failed` and leaves the layout unchanged.

## Error behavior

`load-failed`, `save-failed`, and `subscribe-failed` retain the last valid
controller state. `external-update-failed` rejects only that external update.
`save-conflict-failed` rejects a malformed current record from the host.
Subscribe to bridge events and surface them in application diagnostics; do not
silently replace a working layout with malformed data.

Run the TypeScript-only reference check with:

```sh
npm run typecheck:tauri-example
```

Run native acceptance tests in the consumer application: create a workspace,
open and move a module, restart and restore it, then process native focus and
close events.
