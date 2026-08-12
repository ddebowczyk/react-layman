# PR 12: Add local theming and component slots

**Depends on:** PRs 06, 09, and 10

## Goal and outcome

Make each Layman view easy to theme and customize without global CSS overrides
or forks of internal components.

The outcome lets a Tauri workspace render a product-specific layout while
keeping Layman's drag and docking behavior intact.

## Target customization contract

The `components` prop from PR 09 is the structural extension point. This PR
implements its supported slots and adds a typed token theme:

```ts
type LaymanTheme = Partial<Record<
  "separatorThickness" | "separatorHandleColor" | "toolbarHeight" |
  "toolbarBackground" | "windowBackground" | "tabTextColor" |
  "accentColor" | "borderRadius" | "floatingShadow" | "dockZoneInset",
  string | number
>>;
```

`LaymanView` also accepts `className`, `style`, and stable `data-layman-*`
attributes. Theme values become CSS custom properties on that view root only.

## Change scope

1. Move default variables from global `:root` rules to the Layman root with
   fallbacks. Keep an opt-in compatibility stylesheet for old global overrides
   during the transition release.
2. Replace all `document.documentElement` token reads with root-scoped metrics
   supplied by the view. Include `anchor-inset`, separator thickness, toolbar
   height, and floating resize-handle size in the token set.
3. Support stable slots for pane, tab, empty state, and toolbar-frame visuals.
   Toolbar behavior and widgets stay exclusively in the PR 10 `toolbar` API;
   this PR must not add a second action or widget configuration path. Pass
   semantic props and commands; do not require a consumer to reimplement drag
   source/drop target internals.
4. Document supported CSS part selectors or data attributes for limited visual
   overrides. Treat unlisted internal class names as private.
5. Include keyboard focus, contrast, and reduced-motion token behavior in the
   default theme. Preserve the existing default appearance unless a token is
   set.

## Tests

Render two views with contrasting themes. Prove that values are scoped, geometry
uses each root's toolbar/separator tokens, components receive typed slot props,
and an unmount removes no other view's styles. Add keyboard/focus tests for the
default controls and a no-motion case if the CSS uses transitions.

Run `npm test`, `npm run lint`, and `npm run build:lib`.

## Proposed pull request

**Title:** `feat: add scoped themes and supported Layman component slots`

**Why:** Current customization relies on global `:root` variables and private
markup. That leaks across views and is hard to maintain in an application UI.

**What it solves:** A Tauri TypeScript view can set its own visual system and
module chrome through supported inputs, without taking ownership of layout
mechanics.

**Review boundary:** Theming and rendering customization only. Toolbar behavior
is supplied by PR 10. No native Tauri dependency or persistence behavior change.
