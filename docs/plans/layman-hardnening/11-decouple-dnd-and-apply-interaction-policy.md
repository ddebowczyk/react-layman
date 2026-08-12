# PR 11: Decouple DnD and apply interaction policy

**Depends on:** PR 10

## Goal and outcome

Make drag-and-drop a configurable view adapter rather than a hard-coded global
HTML5 provider. Apply one command policy to mouse actions and host commands.

The outcome improves testability, lets a Tauri view choose its own DnD setup,
and prevents a disabled action from bypassing application policy through drag.

## Current limitation

`LaymanProvider` always mounts `DndProvider` with `HTML5Backend`. Consumers
cannot use an enclosing provider, inject React DnD's test backend, or make a
policy decision before `layoutDispatch` mutates state.

## Change scope

1. Define a `LaymanDndConfig` with an internal default, an external-provider
   mode, and an injectable manager/backend for tests. Do not import a Tauri
   API; DnD remains a browser concern.
2. Route drag/drop and resize actions through `controller.dispatch`; verify the
   toolbar widgets extracted in PR 10 use the same command boundary.
3. Define `LaymanInteractionPolicy.canExecute(context)` to return allow or a
   typed rejection reason. The context includes command, current inspection,
   origin, and view configuration.
4. Disable or hide denied affordances before a drag begins, then enforce the
   same policy at dispatch time as the final authority.
5. Replace the external-tab `[-1]` sentinel with a typed `tab.create` or
   `tab.insertExternal` command that carries a new tab value and origin.

## Tests

Use React DnD's test backend to prove:

- a tab and whole-window drag produce the expected semantic command;
- an external-provider view does not mount a second DnD provider;
- a policy-denied drag never changes state and reports a rejection;
- a disabled toolbar control cannot bypass policy; and
- injected backends and test helpers clean up between views.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `feat: make DnD injectable and enforce a shared interaction policy`

**Why:** Drag behavior currently owns both input handling and state mutation.
That makes it hard to test and impossible for a host to apply one permission
model.

**What it solves:** The Tauri view can choose the DnD boundary, test it without
a browser backend, and prevent a module action from changing layout state when
the workspace policy rejects it.

**Review boundary:** DnD composition and command authorization only. Do not add
toolbar extraction, CSS theme work, or persistence transport here.
