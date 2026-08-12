import { LaymanToolbarButton as e } from "./LaymanToolbarButton.js";
import { toolbarItemProps as t, toolbarItemsForSurface as n } from "./items.js";
import { Fragment as r } from "react";
import { Fragment as i, jsx as a } from "react/jsx-runtime";
//#region src/toolbar/WindowToolbarWidgets.tsx
function o({ items: o, runtime: s, surface: c }) {
	return /* @__PURE__ */ a(i, { children: n(o, s, c).map((n) => {
		let i = t(n, s);
		return /* @__PURE__ */ a(r, { children: n.kind === "builtin" ? n.render?.(i) ?? /* @__PURE__ */ a(e, { ...i }) : n.render(i) }, n.id);
	}) });
}
//#endregion
export { o as WindowToolbarWidgets };
