import { LaymanDndProvider as e } from "./dnd/LaymanDndProvider.js";
import { defaultLaymanToolbar as t } from "./toolbar/defaults.js";
import { defaultLaymanViewMetrics as n } from "./view/metrics.js";
import { createContext as r, useState as i } from "react";
import { Fragment as a, jsx as o } from "react/jsx-runtime";
//#region src/LaymanContext.tsx
var s = {
	globalContainerSize: {
		top: 0,
		left: 0,
		width: 0,
		height: 0
	},
	setGlobalContainerSize: () => {},
	metrics: n,
	setMetrics: () => {},
	layout: void 0,
	layoutDispatch: () => {
		throw Error("[Layman] a view controller is required");
	},
	dropHighlightPosition: {
		top: 0,
		left: 0,
		width: 0,
		height: 0
	},
	setDropHighlightPosition: () => {},
	globalDragging: !1,
	setGlobalDragging: () => {},
	draggedWindowTabs: [],
	setDraggedWindowTabs: () => {},
	windowDragStartPosition: {
		x: 0,
		y: 0
	},
	setWindowDragStartPosition: () => {},
	renderPane: () => /* @__PURE__ */ o(a, {}),
	renderTab: () => /* @__PURE__ */ o(a, {}),
	canExecute: () => ({ kind: "allow" }),
	toolbar: t,
	inspection: {
		rootId: null,
		windows: [],
		splits: []
	},
	renderNull: () => /* @__PURE__ */ o(a, {}),
	maximizedWindowId: null,
	setMaximizedWindowId: () => {},
	floatingWindows: [],
	maxDepth: Infinity,
	showTabs: !0,
	viewId: "layman",
	ariaLabel: void 0,
	rootClassName: void 0,
	rootStyle: {},
	dragBorderElement: null,
	setDragBorderElement: () => {},
	renderToolbarFrame: ({ children: e }) => e
}, c = ({ state: r, inspection: a, dispatch: s, renderPane: c, renderTab: u, renderNull: d, canExecute: f, dnd: p, maxDepth: m, showTabs: h, toolbar: g = t, viewId: _, ariaLabel: v, rootClassName: y, rootStyle: b = {}, renderToolbarFrame: x = ({ children: e }) => e, children: S }) => {
	let [C, w] = i({
		top: 0,
		left: 0,
		width: 0,
		height: 0
	}), [T, E] = i(n), [D, O] = i({
		top: 0,
		left: 0,
		width: 0,
		height: 0
	}), [k, A] = i([]), [j, M] = i({
		x: 0,
		y: 0
	}), [N, P] = i(!1), [F, I] = i(null), [L, R] = i(null);
	return /* @__PURE__ */ o(l.Provider, {
		value: {
			globalContainerSize: C,
			setGlobalContainerSize: w,
			metrics: T,
			setMetrics: E,
			layout: r.layout,
			layoutDispatch: s,
			dropHighlightPosition: D,
			setDropHighlightPosition: O,
			globalDragging: N,
			setGlobalDragging: P,
			draggedWindowTabs: k,
			setDraggedWindowTabs: A,
			windowDragStartPosition: j,
			setWindowDragStartPosition: M,
			renderPane: c,
			renderTab: u,
			canExecute: f,
			toolbar: g,
			inspection: a,
			renderNull: d,
			maximizedWindowId: F,
			setMaximizedWindowId: I,
			floatingWindows: r.floatingWindows,
			maxDepth: m,
			showTabs: h,
			viewId: _,
			ariaLabel: v,
			rootClassName: y,
			rootStyle: b,
			dragBorderElement: L,
			setDragBorderElement: R,
			renderToolbarFrame: x
		},
		children: /* @__PURE__ */ o(e, {
			config: p,
			children: S
		})
	});
}, l = r(s);
//#endregion
export { l as LaymanContext, c as LaymanRuntime };
