import { LaymanContext as e } from "./LaymanContext.js";
import { BottomSplitIcon as t, LeftSplitIcon as n, RightSplitIcon as r, TopSplitIcon as i, UnfloatIcon as a } from "./Icons.js";
import { windowDragType as o } from "./dnd/items.js";
import { isFloatingAddress as s } from "./utils.js";
import { findWindowRectAtPoint as c } from "./layoutGeometry.js";
import { useContext as l } from "react";
import { useDragLayer as u, useDrop as d } from "react-dnd";
import { Fragment as f, jsx as p, jsxs as m } from "react/jsx-runtime";
//#region src/FloatingDockZones.tsx
var h = 200, g = 100, _ = 200, v = {
	top: i,
	bottom: t,
	left: n,
	right: r
};
function y(e, t, n) {
	if (!(!("tabs" in e) || !s(e.path))) return {
		type: "window.move",
		windowId: e.id,
		target: t,
		placement: n
	};
}
function b(e, t, n) {
	switch (e) {
		case "top": return {
			top: n,
			left: (t.width - h) / 2,
			width: h,
			height: g
		};
		case "bottom": return {
			top: t.height - g - n,
			left: (t.width - h) / 2,
			width: h,
			height: g
		};
		case "left": return {
			top: (t.height - h) / 2,
			left: n,
			width: g,
			height: h
		};
		case "right": return {
			top: (t.height - h) / 2,
			left: t.width - g - n,
			width: g,
			height: h
		};
	}
}
function x({ edge: t, container: n }) {
	let { layoutDispatch: r, canExecute: i, metrics: a } = l(e), [{ isOver: s, handlerId: c }, u] = d(() => ({
		accept: [o],
		canDrop: (e) => {
			let n = y(e, { kind: "root" }, t);
			return n !== void 0 && i(n).kind === "allow";
		},
		drop: (e) => {
			let n = y(e, { kind: "root" }, t);
			n && r(n);
		},
		collect: (e) => ({
			isOver: e.isOver(),
			handlerId: e.getHandlerId()
		})
	})), f = v[t];
	return /* @__PURE__ */ p("div", {
		ref: (e) => void u(e),
		className: `layman-floating-anchor ${t} ${s ? "over" : ""}`,
		style: {
			position: "absolute",
			...b(t, n, a.dockZoneInset)
		},
		"data-layman-component": "dock-zone",
		"data-layman-dock-edge": t,
		"data-layman-drop-target": c ?? void 0,
		children: /* @__PURE__ */ p(f, {})
	});
}
function S({ windowId: t, position: n }) {
	let { layoutDispatch: r, canExecute: i } = l(e), [{ isOver: s, handlerId: c }, u] = d(() => ({
		accept: [o],
		canDrop: (e) => {
			let n = y(e, {
				kind: "window",
				windowId: t
			}, "center");
			return n !== void 0 && i(n).kind === "allow";
		},
		drop: (e) => {
			let n = y(e, {
				kind: "window",
				windowId: t
			}, "center");
			n && r(n);
		},
		collect: (e) => ({
			isOver: e.isOver(),
			handlerId: e.getHandlerId()
		})
	}), [t]), f = {
		width: Math.min(_, n.width),
		height: Math.min(_, n.height)
	}, m = {
		top: n.top + (n.height - f.height) / 2,
		left: n.left + (n.width - f.width) / 2,
		...f
	};
	return /* @__PURE__ */ p("div", {
		ref: (e) => void u(e),
		className: `layman-floating-anchor center ${s ? "over" : ""}`,
		style: {
			position: "absolute",
			...m
		},
		"data-layman-component": "dock-zone",
		"data-layman-dock-edge": "center",
		"data-layman-drop-target": c ?? void 0,
		children: /* @__PURE__ */ p(a, {})
	});
}
function C() {
	let { layout: t, globalContainerSize: n, maxDepth: r } = l(e), { isDraggingFloat: i, clientOffset: a } = u((e) => {
		let t = e.getItemType(), n = e.getItem();
		return {
			isDraggingFloat: e.isDragging() && t === "layman/window" && !!n && "tabs" in n && s(n.path),
			clientOffset: e.getClientOffset()
		};
	});
	if (!i) return null;
	let o = a ? {
		x: a.x - n.left,
		y: a.y - n.top
	} : null, d = o && t ? c(t, n, o) : null;
	return /* @__PURE__ */ m(f, { children: [r > 0 && /* @__PURE__ */ m(f, { children: [
		/* @__PURE__ */ p(x, {
			edge: "top",
			container: n
		}),
		/* @__PURE__ */ p(x, {
			edge: "bottom",
			container: n
		}),
		/* @__PURE__ */ p(x, {
			edge: "left",
			container: n
		}),
		/* @__PURE__ */ p(x, {
			edge: "right",
			container: n
		})
	] }), d && /* @__PURE__ */ p(S, {
		windowId: d.windowId,
		position: d.position
	})] });
}
//#endregion
export { C as FloatingDockZones };
