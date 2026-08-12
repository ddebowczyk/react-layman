# Public API reference

This reference covers the stable `react-layman` root export and the stable
`react-layman/styles.css` stylesheet export for `0.4.0`. The
[`tests/package-consumer`](../../tests/package-consumer) fixture type-checks
every name listed here against the emitted `lib/index.d.ts` declaration file.

No public API is experimental or deprecated in this release. A name is either
stable or private. Breaking changes use a new minor version while the package
major version is zero.

## State and engine

<!-- markdownlint-disable MD013 -->

| API | Contract |
| --- | --- |
| `LaymanState`, `LaymanLayout`, `LaymanTree`, `LaymanNode`, `LaymanWindow`, `LaymanTab`, `FloatingWindowData`, `Position`, `JsonPrimitive`, `JsonValue`, `Children`, `LaymanDirection` | JSON-safe layout model with stable IDs. |
| `createLaymanTab`, `createLaymanWindow`, `createLaymanNode` | Create model entities with explicit IDs. |
| `LaymanCommand`, `WindowTarget`, `WindowMoveTarget`, `LaymanPlacement` | Stable-ID command language. Render paths are not inputs. |
| `applyLaymanCommand` | Pure state transition. It never mutates input. |
| `LaymanTransition`, `LaymanChange`, `LaymanRejectionReason` | Result, changed IDs, and typed rejection reason. |
| `validateLaymanState`, `LaymanValidation`, `LaymanValidationIssue` | Validate a whole state before accepting external data. |
| `inspectLaymanState`, `LaymanInspection`, `LaymanInspectedWindow`, `LaymanInspectedSplit`, `LaymanInspectedTab` | Produce a detached, JSON-friendly layout inspection. |

<!-- markdownlint-enable MD013 -->

An applied engine command has a new state reference. A rejected or no-op
command preserves the exact input state reference. Inspect values and snapshot
data are detached from the supplied state.

## Controller and policy

<!-- markdownlint-disable MD013 -->

| API | Contract |
| --- | --- |
| `createLaymanController` | Create a non-React controller around host-owned state. |
| `useLaymanController` | Connect controlled React state or isolated `defaultState` to a controller. |
| `LaymanController`, `LaymanControllerOptions`, `UseLaymanControllerOptions` | State, command, replacement, inspection, and observation contract. |
| `LaymanControllerTransition`, `LaymanCommandMeta`, `LaymanCommandOrigin` | Observable result with revision, origin, request ID, prior state, and next state. |
| `LaymanCommandDispatcher`, `LaymanControllerDispatch`, `LaymanCommandAuthorizer`, `LaymanTransitionListener` | Typed command and transition callbacks. |
| `LaymanInteractionPolicy`, `LaymanInteractionContext`, `LaymanInteractionDecision`, `LaymanInteractionViewConfig` | One permission boundary for user, host, Tauri, agent, toolbar, and drag commands. |

<!-- markdownlint-enable MD013 -->

The controller begins at revision `0`. It increments its revision only for an
applied command or an applied `replaceState`. Rejected and no-op transitions
retain the revision and exact state reference. `onStateChange` runs only for an
applied transition; `onTransition` and `subscribe` receive every transition.
Policy denial produces a rejected transition with `reason: "forbidden"` and
the policy result in `denial`.

`replaceState` validates its input before it becomes controller state. Policy
applies to commands, not to `replaceState`; the host must authorize external
state before replacing it when that is required.

`useLaymanController` also validates each controlled `state` update before it
becomes controller state. An invalid update throws and leaves the prior valid
state in place.

## React view

<!-- markdownlint-disable MD013 -->

| API | Contract |
| --- | --- |
| `LaymanView`, `LaymanViewProps`, `LaymanViewConfig` | Controlled visual workspace. `viewId` is required, non-empty, and unique in the host document. |
| `LaymanComponents` | Required `Pane` and `Tab` slots; optional `Empty` and `ToolbarFrame` slots. |
| `LaymanPaneProps`, `LaymanTabProps`, `LaymanEmptyProps`, `LaymanToolbarFrameProps` | Slot inputs with the current tab or toolbar window, controller, and dispatcher. |
| `LaymanTheme` | Root-scoped visual tokens. Numeric length values become pixels. |
| `LaymanDndConfig` | Select Layman-owned HTML5 DnD, an external provider, or a test manager. |

<!-- markdownlint-enable MD013 -->

The view owns gesture translation and visual state only. It does not own
persistence, native windows, application modules, or permissions. Give its
parent a defined width and height.

`Pane`, `Tab`, `Empty`, and `ToolbarFrame` are the only stable component slots.
`ToolbarFrame` must render its supplied children. The view root exposes stable
`data-layman-*` attributes: `view`, `component`, `window`, `tab`, `split`,
`drop-target`, `dock-edge`, and `resize-direction`. Documented component
values are `root`, `window`, `toolbar`, `tab`, `empty`, `separator`,
`drop-target`, `dock-zone`, `floating-resize-layer`, `floating-resize-handle`,
and `window-menu`.

## Toolbar

<!-- markdownlint-disable MD013 -->

| API | Contract |
| --- | --- |
| `LaymanToolbarConfig`, `LaymanToolbarItem`, `LaymanToolbarItemsResolver` | Define the full widget set and order for one view. |
| `LaymanBuiltinToolbarItem`, `LaymanBuiltinToolbarAction` | Use a typed built-in operation. |
| `LaymanCustomToolbarItem` | Render a host-defined widget. |
| `LaymanToolbarWidgetProps`, `LaymanToolbarContext`, `LaymanToolbarWindow`, `LaymanToolbarItemState` | Semantic window context, inspection, policy-aware dispatch, and visual item state. |
| `LaymanToolbarActionResult`, `LaymanToolbarLocation`, `LaymanToolbarPlacement`, `LaymanToolbarSurface` | Result and placement types. |
| `LaymanToolbarButton` | Minimal visual button primitive for a custom widget. |

<!-- markdownlint-enable MD013 -->

When `config.toolbar` is present, Layman renders only its declared items. The
available built-in actions are `tab.create`, `window.split.top`,
`window.split.bottom`, `window.split.left`, `window.split.right`,
`window.maximize`, `window.float`, and `window.close`.

## Snapshots

<!-- markdownlint-disable MD013 -->

| API | Contract |
| --- | --- |
| `LAYMAN_SNAPSHOT_VERSION` | Current exact snapshot schema version: `2`. |
| `serializeState`, `deserializeState`, `validateLaymanSnapshot` | Convert or validate the whole durable state. |
| `serializeLayout`, `deserializeLayout`, `deserializeTab`, `serializeFloatingWindow`, `deserializeFloatingWindow` | Convert or validate one durable entity. |
| `LaymanSerializedState`, `LaymanSerializedLayout`, `LaymanSerializedTree`, `LaymanSerializedNode`, `LaymanSerializedWindow`, `LaymanSerializedTab`, `LaymanSerializedFloatingWindow`, `LaymanSchemaVersion` | Snapshot type model. |

<!-- markdownlint-enable MD013 -->

Only schema version `2` is accepted. Unknown fields, duplicate IDs, invalid
selections, non-positive floating dimensions or split percentages, non-finite
numbers, cyclic data, and non-JSON tab data are rejected. Layman does not
silently migrate a snapshot. The host must perform any earlier-format migration
before it calls `deserializeState`.

## Tauri and external host bridge

<!-- markdownlint-disable MD013 -->

| API | Contract |
| --- | --- |
| `createLaymanWorkspaceBridge`, `LaymanWorkspaceBridge` | Connect one controller to application-owned workspace ports. |
| `LaymanSnapshotPort`, `LaymanWorkspaceUpdate`, `LaymanWorkspaceUnsubscribe` | Versioned load, save, and external-update contract. |
| `LaymanModuleHost` | Application-owned native module open, focus, and close operations. |
| `LaymanWorkspaceBridgeOptions`, `LaymanWorkspaceInspection`, `LaymanWorkspaceBridgeEvent` | Setup, detached inspection, and typed event stream. |

<!-- markdownlint-enable MD013 -->

The bridge has no Tauri import. It calls ports supplied by the application.
The application gives each update an integer `revision`, a nonempty `originId`,
and a snapshot. The bridge serializes local saves, ignores echoed or stale
external updates, and never persists an accepted external update again. The
application must reject an attempted save older than its stored revision.

Use `bridge.inspect()`, `bridge.dispatch()`, `bridge.replaceState()`, and
`bridge.subscribe()` as the live agent boundary. See the [Tauri integration
guide](../integrations/tauri.md) for setup and error behavior.

## Stylesheet and private names

Import `react-layman/styles.css` once. Use `config.theme` or root-scoped
`--layman-*` variables for visual tokens. The stylesheet honours
`prefers-reduced-motion`.

Private names include all `src/` and `lib/` subpaths, React contexts,
path/address types, DnD item shapes, DOM class names, raw reducer actions, and
undocumented `data-*` values. The removed v0.3 names include `LaymanProvider`,
`Layman`, `TabData`, `LaymanPath`, `layoutDispatch`, and `storageKey`; they are
not aliases and cannot be imported from `0.4.0`.
