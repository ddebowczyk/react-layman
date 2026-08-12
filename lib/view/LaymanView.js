import { LaymanRuntime as e } from "../LaymanContext.js";
import { LaymanCanvas as t } from "../Layman.js";
import { laymanThemeStyle as n } from "./theme.js";
import { useMemo as r, useSyncExternalStore as i } from "react";
import { jsx as a } from "react/jsx-runtime";
//#region src/view/LaymanView.tsx
function o(e) {
	return i((t) => e.subscribe(() => t()), () => e.getState(), () => e.getState());
}
function s(e) {
	if (typeof e != "string" || e.trim().length === 0) throw Error("[Layman] viewId must be a non-empty string");
}
function c({ controller: i, config: c, components: l, className: u, style: d }) {
	s(c.viewId);
	let f = o(i), p = i.inspect(), { Pane: m, Tab: h, Empty: g, ToolbarFrame: _ } = l, v = {
		viewId: c.viewId,
		maxDepth: c.maxDepth ?? Infinity,
		showTabs: c.showTabs ?? !0
	}, y = r(() => ({
		...n(c.theme),
		...d
	}), [c.theme, d]), b = (e) => i.dispatch(e, {
		origin: "user",
		view: v
	}), x = (e) => i.canExecute(e, {
		origin: "user",
		view: v
	});
	return /* @__PURE__ */ a(e, {
		state: f,
		inspection: p,
		dispatch: (e) => b(e),
		canExecute: (e) => x(e),
		renderPane: (e, t, n) => /* @__PURE__ */ a(m, {
			tab: e,
			windowId: t,
			selected: n,
			controller: i,
			dispatch: b
		}),
		renderTab: (e, t, n) => /* @__PURE__ */ a(h, {
			tab: e,
			windowId: t,
			selected: n,
			controller: i,
			dispatch: b
		}),
		renderNull: () => /* @__PURE__ */ a("div", {
			className: "layman-empty",
			"data-layman-component": "empty",
			children: g ? /* @__PURE__ */ a(g, {
				controller: i,
				dispatch: b
			}) : "No windows"
		}),
		dnd: c.dnd,
		maxDepth: v.maxDepth,
		showTabs: v.showTabs,
		toolbar: c.toolbar,
		viewId: c.viewId,
		ariaLabel: c.ariaLabel,
		rootClassName: u,
		rootStyle: y,
		renderToolbarFrame: (e) => _ ? /* @__PURE__ */ a(_, { ...e }) : e.children,
		children: /* @__PURE__ */ a(t, {})
	});
}
//#endregion
export { c as LaymanView };
