import { AddIcon as e, BottomSplitIcon as t, CloseIcon as n, FloatIcon as r, LeftSplitIcon as i, MaximizeIcon as a, MinimizeIcon as o, RightSplitIcon as s, TopSplitIcon as c, UnfloatIcon as l } from "../Icons.js";
import { ToolbarButton as u } from "../ToolbarButton.js";
import { jsx as d } from "react/jsx-runtime";
//#region src/toolbar/LaymanToolbarButton.tsx
function f(u, f) {
	switch (u) {
		case "tab.create": return /* @__PURE__ */ d(e, {});
		case "window.split.top": return /* @__PURE__ */ d(c, {});
		case "window.split.bottom": return /* @__PURE__ */ d(t, {});
		case "window.split.left": return /* @__PURE__ */ d(i, {});
		case "window.split.right": return /* @__PURE__ */ d(s, {});
		case "window.maximize": return d(f ? o : a, {});
		case "window.float": return d(f ? l : r, {});
		case "window.close": return /* @__PURE__ */ d(n, {});
	}
}
function p({ item: e, state: t, invoke: n }) {
	return e.kind === "builtin" ? /* @__PURE__ */ d(u, {
		"aria-label": t.label,
		"data-layman-toolbar-item": e.id,
		disabled: t.disabled,
		onClick: n,
		title: t.disabledReason ?? t.label,
		children: f(e.action, !!t.active)
	}) : null;
}
//#endregion
export { p as LaymanToolbarButton };
