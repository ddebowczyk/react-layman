import { readLaymanViewMetrics as e, sameLaymanViewMetrics as t } from "./view/metrics.js";
import { LaymanContext as n } from "./LaymanContext.js";
import { addressKey as r } from "./utils.js";
import { WindowToolbar as i } from "./WindowToolbar.js";
import { Window as a } from "./Window.js";
import { Separator as o } from "./Separator.js";
import { FloatingResizeHandleLayer as s } from "./FloatingWindow.js";
import { FloatingDockZones as c } from "./FloatingDockZones.js";
import { DropHighlight as l } from "./DropHighlight.js";
import { useCallback as u, useContext as d, useEffect as f, useLayoutEffect as p, useMemo as m, useRef as h } from "react";
import { jsx as g, jsxs as _ } from "react/jsx-runtime";
//#region src/Layman.tsx
function v() {
	let { globalContainerSize: v, setGlobalContainerSize: y, setMetrics: b, layout: x, renderNull: S, draggedWindowTabs: C, floatingWindows: w, viewId: T, ariaLabel: E, rootClassName: D, rootStyle: O, setDragBorderElement: k, dropHighlightPosition: A, globalDragging: j } = d(n), M = h(null), N = u(() => {
		let n = M.current;
		if (!n) return;
		let { top: r, left: i, width: a, height: o } = n.getBoundingClientRect();
		y({
			top: r,
			left: i,
			width: a,
			height: o
		});
		let s = e(n);
		b((e) => t(e, s) ? e : s);
	}, [y, b]);
	p(() => (N(), window.addEventListener("resize", N), () => {
		window.removeEventListener("resize", N);
	}), [O, N]), f(() => {
		if (!M.current) return;
		let e = M.current, t = new ResizeObserver(N);
		return t.observe(e), () => {
			t.disconnect();
		};
	}, [N]);
	let { toolbars: P, windows: F, separators: I } = m(() => {
		let e = [], t = [], n = [];
		function r(i, a, o) {
			if (!i) return;
			if ("tabs" in i) {
				e.push({
					windowId: i.id,
					path: o,
					position: a,
					tabs: i.tabs,
					selectedTabId: i.selectedTabId
				}), i.tabs.forEach((e) => {
					t.push({
						windowId: i.id,
						position: a,
						path: o,
						tab: e,
						isSelected: e.id === i.selectedTabId
					});
				});
				return;
			}
			let { direction: s, children: c } = i, l = (e) => s === "row" ? a.width * (e / 100) : a.height * (e / 100), u = (e, t) => s === "row" ? {
				top: a.top,
				left: a.left + e,
				width: t,
				height: a.height
			} : {
				top: a.top + e,
				left: a.left,
				width: a.width,
				height: t
			}, d = (e, t, r) => {
				n.push({
					splitId: i.id,
					nodePosition: a,
					position: r,
					index: t,
					direction: s,
					path: o.concat([e])
				});
			};
			if (!(C.length > 0 && c.some((e) => e && "tabs" in e && e.tabs == C))) {
				let e = 0;
				c.forEach((t, n) => {
					if (!t) return;
					let i = l(t.viewPercent ?? 100 / c.length), s = u(e, i);
					r(t, s, o.concat([n])), n != 0 && d(n, n - 1, {
						...s,
						width: a.width,
						height: a.height
					}), e += i;
				});
				return;
			}
			let f = c.find((e) => e && "tabs" in e && e.tabs == C), p = f ? f.viewPercent : void 0, m = 0;
			c.forEach((e, t) => {
				if (!e || "tabs" in e && e.tabs == C) return;
				let n = l(p ? (e.viewPercent ? e.viewPercent : 100 / c.length) * 100 / (100 - p) : (e.viewPercent ? e.viewPercent : 100 / c.length) * c.length / (c.length - 1));
				r(e, u(m, n), o.concat([t])), t != c.length - 1 && d(t, t, {
					top: 0,
					left: 0,
					width: 0,
					height: 0
				}), m += n;
			}), m = 0, c.forEach((e, t) => {
				if (!e) return;
				let n = l(e.viewPercent ?? 100 / c.length), i = u(m, n);
				"tabs" in e && e.tabs == C && (r(e, i, o.concat([t])), t != c.length - 1 && d(t, t, {
					top: 0,
					left: 0,
					width: 0,
					height: 0
				})), m += n;
			});
		}
		return r(x, {
			top: 0,
			left: 0,
			width: v.width,
			height: v.height
		}, []), w.forEach((n) => {
			e.push({
				windowId: n.id,
				path: { floatingId: n.id },
				position: n.position,
				tabs: n.tabs,
				selectedTabId: n.selectedTabId,
				zIndex: n.zIndex
			}), n.tabs.forEach((e) => {
				t.push({
					windowId: n.id,
					position: n.position,
					path: { floatingId: n.id },
					tab: e,
					isSelected: e.id === n.selectedTabId,
					zIndex: n.zIndex
				});
			});
		}), {
			toolbars: e,
			windows: t,
			separators: n
		};
	}, [
		v,
		C,
		x,
		w
	]);
	return /* @__PURE__ */ _("div", {
		ref: M,
		className: ["layman-root", D].filter(Boolean).join(" "),
		style: O,
		role: "application",
		"aria-label": E,
		"data-layman-component": "root",
		"data-layman-view": T,
		children: [
			/* @__PURE__ */ g("div", {
				ref: k,
				"data-layman-component": "drag-border-layer"
			}),
			/* @__PURE__ */ g(l, {
				position: A,
				isDragging: j
			}),
			!x && S(),
			P.map((e) => /* @__PURE__ */ g(i, { ...e }, r(e.path))),
			F.map((e) => /* @__PURE__ */ g(a, { ...e }, e.tab.id)),
			I.map((e) => /* @__PURE__ */ g(o, {
				separators: I,
				...e
			}, e.path.length == 0 ? "root" : e.path.join(":"))),
			/* @__PURE__ */ g(s, {}),
			/* @__PURE__ */ g(c, {})
		]
	});
}
//#endregion
export { v as LaymanCanvas };
