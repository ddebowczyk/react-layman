import { LaymanContext as e } from "./LaymanContext.js";
import { tabDragType as t, windowDragType as n } from "./dnd/items.js";
import { isFloatingAddress as r } from "./utils.js";
import { useContext as i, useEffect as a, useRef as o } from "react";
import { useDrop as s } from "react-dnd";
import { jsx as c } from "react/jsx-runtime";
//#region src/WindowDropTarget.tsx
function l(e, t, n, i) {
	if (t === "layman/tab" && "tab" in e) return {
		type: "tab.move",
		tabId: e.tab.id,
		target: {
			kind: "window",
			windowId: n
		},
		placement: i
	};
	if (t === "layman/window" && "tabs" in e && !r(e.path)) return {
		type: "window.move",
		windowId: e.id,
		target: {
			kind: "window",
			windowId: n
		},
		placement: i
	};
}
function u({ windowId: u, path: d, position: f, placement: p }) {
	let { layoutDispatch: m, setDropHighlightPosition: h, canExecute: g, maxDepth: _, showTabs: v, metrics: y } = i(e), b = o({
		top: 0,
		left: 0,
		width: 0,
		height: 0
	}), x = p !== "center" && !r(d) && d.length >= _, S = v ? y.toolbarHeight : 0, { separatorThickness: C } = y;
	a(() => {
		let e = {
			top: f.top + S,
			left: f.left,
			width: f.width - C,
			height: f.height - S - C / 2
		};
		p === "top" && (e.height /= 2), p === "bottom" && (e.top += e.height / 2, e.height /= 2), p === "left" && (e.width /= 2), p === "right" && (e.left += e.width / 2, e.width /= 2), b.current = e;
	}, [
		p,
		f.height,
		f.left,
		f.top,
		f.width,
		C,
		S
	]);
	let [{ handlerId: w }, T] = s(() => ({
		accept: [t, n],
		canDrop: (e, t) => {
			let n = l(e, t.getItemType(), u, p);
			return n !== void 0 && g(n).kind === "allow";
		},
		drop: (e, t) => {
			let n = l(e, t.getItemType(), u, p);
			n && m(n);
		},
		hover: (e, t) => {
			t.canDrop() && h(b.current);
		},
		collect: (e) => ({ handlerId: e.getHandlerId() })
	}));
	return x ? null : /* @__PURE__ */ c("div", {
		ref: (e) => void T(e),
		className: `layman-window-drop-target ${p}`,
		"data-layman-component": "drop-target",
		"data-layman-drop-target": w ?? void 0
	});
}
//#endregion
export { u as WindowDropTarget };
