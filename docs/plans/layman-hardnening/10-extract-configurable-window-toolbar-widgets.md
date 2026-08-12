# PR 10: Extract configurable window toolbar widgets

**Depends on:** PR 09

## Goal and outcome

Extract the current tile-frame toolbar controls into a typed, host-owned widget
model. A host must choose, remove, reorder, replace, and add every widget for
a given window without importing private context or reducer actions.

The outcome gives the Tauri TypeScript view layer direct control over the top
bar widgets of every tiled or floating Layman window. When a `toolbar` config
is supplied, it is authoritative: Layman must render no implicit add-tab,
ellipsis, split, or other control. The Layman frame, tab strip, and drag region
remain library-owned in this PR; PR 12 separately adds their supported visual
customization without reintroducing implicit toolbar widgets.

## Current behavior and gaps

`WindowToolbar.tsx` has a partial `toolbarButtons` array. It accepts only these
fixed names: four splits, maximize/minimize, float/unfloat, close, and `misc`.
The demo uses `splitBottom`, `splitRight`, `maximize`, and `float`.

This is not a complete configuration boundary:

- the add-tab button is always rendered and always creates `new TabData("blank")`;
- the `misc` ellipsis is always appended while tabs are visible, but its click
  handler is empty;
- callers cannot define a custom widget, an accessible label, or a command
  policy per module/window;
- the component builds React nodes inline and passes them to the compact menu,
  rather than exposing declarative toolbar items; and
- each handler calls private `layoutDispatch` or UI setters directly.

## Target API

Add a public configuration field on `LaymanViewConfig`:

```ts
interface LaymanToolbarConfig<TData> {
  items: LaymanToolbarItemsResolver<TData>;
  overflow?: "never" | "auto";
}

type LaymanToolbarItemsResolver<TData> =
  | readonly LaymanToolbarItem<TData>[]
  | ((context: LaymanToolbarContext<TData>) => readonly LaymanToolbarItem<TData>[]);

type LaymanToolbarItem<TData> =
  | LaymanBuiltinToolbarItem<TData>
  | LaymanCustomToolbarItem<TData>;

interface LaymanBuiltinToolbarItem<TData> {
  kind: "builtin";
  id: string;
  action: LaymanBuiltinToolbarAction;
  placement?: "bar" | "overflow" | "both";
  render?: (props: LaymanToolbarWidgetProps<TData>) => React.ReactNode;
}

interface LaymanCustomToolbarItem<TData> {
  kind: "custom";
  id: string;
  placement?: "bar" | "overflow" | "both";
  render: (props: LaymanToolbarWidgetProps<TData>) => React.ReactNode;
}

type LaymanBuiltinToolbarAction =
  | "tab.create"
  | "window.split.top"
  | "window.split.bottom"
  | "window.split.left"
  | "window.split.right"
  | "window.maximize"
  | "window.float"
  | "window.close";
```

`LaymanToolbarContext` includes the stable `window`, selected tab, location,
view ID, inspection data, and a typed `dispatch` function. It must not expose
tree paths, `layoutDispatch`, or React state setters. A custom widget can call
its own host callback, or dispatch a documented Layman command.

`LaymanToolbarWidgetProps` includes the context, render surface, visible and
disabled state, accessible disabled reason, and an action invocation function.
It lets a host replace any built-in button with arbitrary React markup while
retaining validated controller commands and policy checks. The default built-in
renderer is a convenience only; it is never the only way to render an action.

The `tab.create` item must use a configured tab factory or host command. The
library must never silently create a generic `"blank"` module tab for an
application that has no such module.

## Change scope

1. Split `WindowToolbar` into view composition, tab strip, drag area, and a
   `WindowToolbarWidgets` renderer. Move existing split/maximize/float/close
   handlers into a built-in action registry, not fixed React nodes.
2. Convert each built-in widget to a descriptor with stable ID, icon, label,
   command factory, visibility condition, and disabled reason. Let a supplied
   renderer replace all of that visual and event presentation. Toggle icons
   remain one action: maximize/minimize and float/unfloat.
3. Render the same descriptors in the normal top bar and compact menu. Render
   overflow only if it contains items; remove the current no-op `misc` button.
4. Treat a supplied `toolbar.items` list as the complete widget set. Support a
   global list and an optional resolver so a host can omit all library controls
   or select a different set for each module or window. Preserve the declared
   order and placement exactly.
5. Route built-ins through the PR 09 controller and interaction policy. A
   denied item is hidden or disabled with an accessible reason; default and
   custom renderers cannot bypass policy when they invoke a Layman action.
6. Keep `toolbarButtons` as a deprecated adapter that maps to the matching
   built-in actions. It must no longer force add-tab or ellipsis controls; new
   `toolbar` config takes precedence over it.
7. Export the toolbar configuration, item, widget-props, and context types, as
   well as an optional default button primitive. Document their lifetime:
   custom React nodes are view-only, while persistent module state stays in the
   typed tab data owned by the host.

## Tests

Add component and type tests that prove:

- a configured set renders only the requested built-ins, in order;
- an empty `items` list renders no library widget or hidden toolbar affordance;
- omitting `tab.create`, split, close, or float removes the affordance and no
  hidden handler can mutate the layout;
- a custom widget receives typed stable IDs and can invoke a host callback or
  a policy-checked Layman command;
- every built-in can use a custom renderer with its own markup, label, icon,
  and event handling, without changing its command semantics;
- placement and resolver output control ordering and bar/overflow location;
- split visibility obeys depth and policy; float/maximize toggles preserve their
  accessible labels and correct commands;
- the compact menu renders the same permitted actions and has no dead ellipsis;
- legacy `toolbarButtons` maps to compatible behavior during deprecation; and
- two views can resolve different widget sets without state or DOM crossover.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `feat: make window toolbar widgets fully host-defined`

**Why:** A desktop product rarely wants every generic layout operation on every
module frame. The existing list only selects a few hard-coded icons and still
renders forced controls.

**What it solves:** A Tauri TypeScript view owns the complete top-bar widget
set. It can use zero built-ins, replace every built-in's UI, add product
widgets, and change their order and placement without forking Layman's drag or
layout code.

**Review boundary:** Toolbar extraction, declarative widget configuration, and
compatibility mapping only. DnD composition, themes, persistence, and Tauri
transport remain separate PRs.
