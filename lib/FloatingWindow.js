import { LaymanContext as e } from "./LaymanContext.js";
import { useContext as t, useEffect as n, useRef as r } from "react";
import { Fragment as i, jsx as a } from "react/jsx-runtime";
//#region src/FloatingWindow.tsx
var o = 200, s = 200;
function c({ data: i }) {
	let { canExecute: c, layoutDispatch: l } = t(e), u = r(null);
	n(() => {
		let e = (e) => {
			let t = u.current;
			if (!t) return;
			let n = e.clientX - t.startX, r = e.clientY - t.startY, a = t.startPos, { top: c, left: d, width: f, height: p } = a;
			t.dir.includes("e") && (f = Math.max(o, a.width + n)), t.dir.includes("s") && (p = Math.max(s, a.height + r)), t.dir.includes("w") && (f = Math.max(o, a.width - n), d = a.left + (a.width - f)), t.dir.includes("n") && (p = Math.max(s, a.height - r), c = a.top + (a.height - p)), l({
				type: "floating.position",
				windowId: i.id,
				position: {
					top: c,
					left: d,
					width: f,
					height: p
				}
			});
		}, t = () => {
			u.current = null;
		};
		return document.addEventListener("mousemove", e), document.addEventListener("mouseup", t), () => {
			document.removeEventListener("mousemove", e), document.removeEventListener("mouseup", t);
		};
	}, [i.id]);
	let d = (e) => (t) => {
		t.preventDefault(), t.stopPropagation(), c({
			type: "floating.position",
			windowId: i.id,
			position: i.position
		}).kind !== "deny" && (l({
			type: "floating.focus",
			windowId: i.id
		}), u.current = {
			dir: e,
			startX: t.clientX,
			startY: t.clientY,
			startPos: i.position
		});
	};
	return /* @__PURE__ */ a("div", {
		className: "layman-floating-resize-handles",
		style: {
			position: "absolute",
			top: i.position.top,
			left: i.position.left,
			width: i.position.width,
			height: i.position.height,
			zIndex: i.zIndex + 1,
			pointerEvents: "none"
		},
		"data-layman-component": "floating-resize-layer",
		"data-layman-window": i.id,
		children: [
			"n",
			"s",
			"e",
			"w",
			"ne",
			"nw",
			"se",
			"sw"
		].map((e) => /* @__PURE__ */ a("div", {
			className: `layman-floating-resize ${e}`,
			onMouseDown: d(e),
			"data-layman-component": "floating-resize-handle",
			"data-layman-resize-direction": e
		}, e))
	});
}
function l() {
	let { floatingWindows: n } = t(e);
	return /* @__PURE__ */ a(i, { children: n.map((e) => /* @__PURE__ */ a(c, { data: e }, e.id)) });
}
//#endregion
export { l as FloatingResizeHandleLayer };
