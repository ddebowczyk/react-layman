import { LaymanContext as e } from "./LaymanContext.js";
import { deepEqual as t } from "./utils.js";
import { useContext as n, useEffect as r, useState as i } from "react";
import { jsx as a } from "react/jsx-runtime";
//#region src/Separator.tsx
function o({ splitId: o, nodePosition: s, position: c, index: l, direction: u, path: d, separators: f }) {
	let { canExecute: p, globalContainerSize: m, layoutDispatch: h, metrics: g } = n(e), [_, v] = i(!1), { separatorThickness: y, toolbarHeight: b } = g, x = f.find((e) => {
		let n = [...d];
		return --n[n.length - 1], t(e.path, n);
	})?.position, S = f.find((e) => {
		let n = [...d];
		return n[n.length - 1] += 1, t(e.path, n);
	})?.position, C = (e) => {
		e.preventDefault(), v(!1);
	};
	return r(() => {
		let e = (e) => {
			let t = e.clientX - m.left, n = e.clientY - m.top, r = u === "column" ? 100 * ((n - (x ? x.top : s.top)) / s.height) : 100 * ((t - (x ? x.left : s.left)) / s.width), i = 100 * (b + y) / (u === "column" ? s.height : s.width), a = (u === "column" ? 100 * (((S ? S.top : s.top + s.height) - (x ? x.top : s.top)) / s.height) : 100 * (((S ? S.left : s.left + s.width) - (x ? x.left : s.left)) / s.width)) - i;
			return Math.min(Math.max(r, i), a);
		}, t = (t) => {
			t.preventDefault(), _ && h({
				type: "split.resize",
				splitId: o,
				index: l,
				leadingPercent: e(t)
			});
		};
		return document.addEventListener("mousemove", t), document.addEventListener("mouseup", C), () => {
			document.removeEventListener("mousemove", t), document.removeEventListener("mouseup", C);
		};
	}, [
		u,
		m.left,
		m.top,
		l,
		_,
		h,
		S,
		s.height,
		s.left,
		s.top,
		s.width,
		o,
		x,
		y,
		b
	]), /* @__PURE__ */ a("div", {
		style: {
			top: c.top,
			left: c.left,
			width: u === "column" ? c.width : y,
			height: u === "row" ? c.height : y
		},
		className: `layman-separator ${u === "column" ? "layman-col-separator" : "layman-row-separator"}`,
		onMouseDown: (e) => {
			e.preventDefault(), p({
				type: "split.resize",
				splitId: o,
				index: l,
				leadingPercent: 50
			}).kind !== "deny" && v(!0);
		},
		onMouseUp: C,
		"data-layman-component": "separator",
		"data-layman-split": o,
		children: /* @__PURE__ */ a("div", {})
	});
}
//#endregion
export { o as Separator };
