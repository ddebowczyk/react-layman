import { LaymanContext as e } from "./LaymanContext.js";
import { EllipsisIcon as t } from "./Icons.js";
import { ToolbarButton as n } from "./ToolbarButton.js";
import { isFloatingAddress as ee } from "./utils.js";
import { WindowDropTarget as r } from "./WindowDropTarget.js";
import { WindowMenu as i } from "./WindowMenu.js";
import { SingleTab as te, Tab as a } from "./WindowTabs.js";
import { hasToolbarSurfaceItems as o, resolveToolbarItems as s } from "./toolbar/items.js";
import { WindowToolbarWidgets as c } from "./toolbar/WindowToolbarWidgets.js";
import { useWindowDrag as l } from "./useWindowDrag.js";
import { useContext as u, useEffect as d, useRef as f, useState as p } from "react";
import { Fragment as m, jsx as h, jsxs as g } from "react/jsx-runtime";
//#region src/WindowToolbar.tsx
function _(e) {
	let t = f(e);
	return d(() => {
		t.current = e;
	}, [e]), t.current;
}
function v({ windowId: v, path: y, position: b, tabs: x, selectedTabId: S, zIndex: C }) {
	let { layout: w, layoutDispatch: T, canExecute: E, globalContainerSize: D, metrics: O, globalDragging: k, toolbar: A, inspection: ne, maximizedWindowId: re, setMaximizedWindowId: ie, maxDepth: ae, showTabs: j, viewId: oe, renderToolbarFrame: M } = u(e), N = f(null), [P, F] = p(!1), [I, L] = p(!1), R = ee(y), z = re === v, B = z ? {
		top: 0,
		left: 0,
		width: D.width,
		height: D.height
	} : b, V = _(x.length), H = j ? O.toolbarHeight : 0, { separatorThickness: U } = O, W = R || y.length >= ae;
	d(() => {
		let e = N.current;
		x.length > V && e && e.scrollWidth > e.clientWidth && (e.scrollLeft = e.scrollWidth);
	}, [x.length, V]);
	let G = (e) => {
		let t = N.current;
		!t || t.scrollWidth <= t.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX) || (t.scrollLeft += e.deltaY);
	}, { currentMousePosition: K, drag: se, dragStartPosition: ce, isDragging: le, isSingleTabDragging: ue, setDragStartPosition: q, singleTabDrag: de } = l({
		windowId: v,
		path: y,
		position: B,
		tabs: x,
		selectedTabId: S
	}), J = le || ue, Y = J && !R ? .7 : 1, X = {
		viewId: oe,
		window: {
			id: v,
			tabs: x,
			selectedTabId: S,
			location: R ? "floating" : "tiled"
		},
		inspection: ne,
		isMaximized: z,
		dispatch: T,
		canExecute: E
	}, Z = s(A, X), Q = {
		config: A,
		context: X,
		layout: w,
		rawPosition: b,
		container: D,
		atMaxDepth: W,
		setMaximized: ie
	}, fe = A.overflow === "auto" && o(Z, Q, "overflow"), pe = o(Z, Q, "compact"), me = {
		top: B.top + K.top,
		left: B.left * Y + K.left,
		width: B.width - U,
		height: H
	}, he = {
		top: B.top + H,
		left: B.left,
		width: B.width - U,
		height: B.height - H - U / 2
	}, ge = () => {
		R && E({
			type: "floating.focus",
			windowId: v
		}).kind === "allow" && T({
			type: "floating.focus",
			windowId: v
		});
	}, $ = j ? /* @__PURE__ */ g("div", {
		style: {
			...me,
			transform: `scale(${Y})`,
			transformOrigin: `${ce.x}px bottom`,
			zIndex: z ? 20 : R ? J ? 999 : C ?? 30 : J ? 13 : 7,
			pointerEvents: J ? "none" : "auto",
			userSelect: J ? "none" : "auto"
		},
		className: `layman-toolbar ${R ? "floating" : ""}`,
		onMouseDown: ge,
		"data-layman-component": "toolbar",
		"data-layman-window": v,
		children: [
			/* @__PURE__ */ h("div", {
				ref: N,
				className: "tab-container",
				onWheel: G,
				children: x.length > 1 ? x.map((e) => /* @__PURE__ */ h(a, {
					windowId: v,
					path: y,
					tab: e,
					isSelected: e.id === S,
					onDelete: () => T({
						type: "tab.remove",
						tabId: e.id
					}),
					onSelect: () => T({
						type: "tab.select",
						tabId: e.id
					})
				}, e.id)) : /* @__PURE__ */ h(te, {
					dragRef: de,
					tab: x[0],
					windowId: v,
					onDelete: () => T({
						type: "tab.remove",
						tabId: x[0].id
					}),
					onMouseDown: (e) => q({
						x: e.clientX,
						y: e.clientY
					}),
					onSelect: () => T({
						type: "tab.select",
						tabId: x[0].id
					})
				})
			}),
			/* @__PURE__ */ h("div", {
				ref: (e) => void se(e),
				className: "drag-area",
				onMouseDown: (e) => q({
					x: e.clientX,
					y: e.clientY
				})
			}),
			/* @__PURE__ */ g("div", {
				className: "toolbar-button-container",
				children: [/* @__PURE__ */ h(c, {
					items: Z,
					runtime: Q,
					surface: "bar"
				}), fe && /* @__PURE__ */ g("div", {
					className: "layman-toolbar-overflow",
					children: [/* @__PURE__ */ h(n, {
						"aria-label": "More window controls",
						"aria-expanded": I,
						onClick: () => L(!I),
						children: /* @__PURE__ */ h(t, {})
					}), I && /* @__PURE__ */ h("div", {
						className: "layman-toolbar-overflow-popover",
						children: /* @__PURE__ */ h(c, {
							items: Z,
							runtime: Q,
							surface: "overflow"
						})
					})]
				})]
			})
		]
	}) : pe && /* @__PURE__ */ h(i, {
		windowId: v,
		position: B,
		tabs: x,
		selectedTabId: S,
		open: P,
		setOpen: F,
		controls: /* @__PURE__ */ h(c, {
			items: Z,
			runtime: Q,
			surface: "compact"
		})
	});
	return /* @__PURE__ */ g(m, { children: [$ && M({
		window: X.window,
		isMaximized: z,
		children: $
	}), !J && /* @__PURE__ */ g("div", {
		style: {
			position: "absolute",
			...he,
			zIndex: 10,
			margin: "calc(var(--layman-separator-thickness) / 2)",
			marginTop: 0,
			pointerEvents: k ? "auto" : "none"
		},
		children: [
			/* @__PURE__ */ h(r, {
				windowId: v,
				path: y,
				position: B,
				placement: "top"
			}),
			/* @__PURE__ */ h(r, {
				windowId: v,
				path: y,
				position: B,
				placement: "bottom"
			}),
			/* @__PURE__ */ h(r, {
				windowId: v,
				path: y,
				position: B,
				placement: "left"
			}),
			/* @__PURE__ */ h(r, {
				windowId: v,
				path: y,
				position: B,
				placement: "right"
			}),
			/* @__PURE__ */ h(r, {
				windowId: v,
				path: y,
				position: B,
				placement: "center"
			})
		]
	})] });
}
//#endregion
export { v as WindowToolbar };
