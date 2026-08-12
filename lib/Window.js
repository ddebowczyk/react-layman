import { LaymanContext as e } from "./LaymanContext.js";
import { isFloatingAddress as t } from "./utils.js";
import { useContext as n, useEffect as r, useState as i } from "react";
import { useDragLayer as a } from "react-dnd";
import { jsx as o, jsxs as s } from "react/jsx-runtime";
import { createPortal as c } from "react-dom";
//#region src/Window.tsx
function l({ windowId: l, position: u, path: d, tab: f, isSelected: p, zIndex: m }) {
	let { globalContainerSize: h, metrics: g, renderPane: _, draggedWindowTabs: v, windowDragStartPosition: y, maximizedWindowId: b, showTabs: x, layoutDispatch: S, canExecute: C, dragBorderElement: w } = n(e), T = t(d), E = x ? g.toolbarHeight : 0, { separatorThickness: D } = g, O = b === l, k = O ? {
		top: 0,
		left: 0,
		width: h.width,
		height: h.height
	} : u, A = v.includes(f), j = A && !T ? .7 : 1, M = () => {
		T && C({
			type: "floating.focus",
			windowId: l
		}).kind === "allow" && S({
			type: "floating.focus",
			windowId: l
		});
	}, { clientOffset: N } = a((e) => ({ clientOffset: e.getClientOffset() })), [P, F] = i({
		top: 0,
		left: 0
	});
	r(() => {
		if (A && N) {
			let e = y.x, t = y.y;
			F({
				top: N.y - t,
				left: N.x - e
			});
		} else F({
			top: 0,
			left: 0
		});
	}, [
		N,
		A,
		y.x,
		y.y
	]);
	let I = {
		top: k.top + E + D / 2 + P.top,
		left: k.left * j + P.left,
		width: k.width - D,
		height: k.height - E - D
	}, L = {
		top: k.top + E / 2 * j + P.top,
		left: k.left * j + P.left,
		width: k.width - D + 2,
		height: k.height - D / 2
	}, R = O ? 20 : T ? A ? 999 : m ?? 30 : A ? 12 : 5;
	return /* @__PURE__ */ s("div", {
		style: {
			...I,
			transform: `scale(${j})`,
			transformOrigin: `${y.x}px top`,
			zIndex: R,
			pointerEvents: A ? "none" : "auto"
		},
		className: `layman-window ${p ? "selected" : "unselected"} ${T ? "floating" : ""}`,
		onMouseDown: M,
		"data-layman-component": "window",
		"data-layman-window": l,
		"data-layman-tab": f.id,
		children: [A && !T && w && c(/* @__PURE__ */ o("div", { style: {
			position: "absolute",
			zIndex: 12,
			...L,
			transform: `scale(${j})`,
			transformOrigin: `${y.x}px top`,
			border: "var(--layman-indicator-thickness) solid var(--layman-accent-color)",
			borderRadius: "var(--layman-border-radius)",
			pointerEvents: "none",
			userSelect: "none"
		} }), w), _(f, l, p)]
	});
}
//#endregion
export { l as Window };
