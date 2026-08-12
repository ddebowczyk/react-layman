import { LaymanContext as e } from "./LaymanContext.js";
import { CloseIcon as t } from "./Icons.js";
import { tabDragType as n } from "./dnd/items.js";
import { useContext as r, useEffect as i } from "react";
import { useDrag as a } from "react-dnd";
import { jsx as o, jsxs as s } from "react/jsx-runtime";
//#region src/WindowTabs.tsx
var c = ({ tab: c, windowId: l, path: u, isSelected: d, onDelete: f, onSelect: p }) => {
	let { canExecute: m, renderTab: h, setGlobalDragging: g } = r(e), _ = m({
		type: "tab.select",
		tabId: c.id
	}), v = m({
		type: "tab.remove",
		tabId: c.id
	}), y = m({
		type: "tab.move",
		tabId: c.id,
		target: {
			kind: "window",
			windowId: l
		},
		placement: "center"
	}), [{ isDragging: b }, x] = a({
		type: n,
		item: {
			path: u,
			tab: c
		},
		canDrag: y.kind === "allow",
		collect: (e) => ({ isDragging: e.isDragging() })
	});
	return i(() => {
		g(b);
	}, [b, g]), /* @__PURE__ */ s("div", {
		ref: (e) => void x(e),
		className: `tab ${d ? "selected" : ""}`,
		style: {
			visibility: b ? "hidden" : "visible",
			width: b ? 0 : "auto"
		},
		"data-layman-component": "tab",
		"data-layman-tab": c.id,
		"data-layman-window": l,
		children: [/* @__PURE__ */ o("button", {
			className: "tab-selector",
			type: "button",
			disabled: _.kind === "deny",
			onClick: p,
			children: h(c, l, d)
		}), /* @__PURE__ */ o("button", {
			type: "button",
			"aria-label": `Close ${c.title}`,
			className: "close-tab",
			disabled: v.kind === "deny",
			onClick: f,
			children: /* @__PURE__ */ o(t, {})
		})]
	});
}, l = ({ dragRef: n, tab: i, windowId: a, onDelete: c, onMouseDown: l, onSelect: u }) => {
	let { canExecute: d, renderTab: f } = r(e), p = d({
		type: "tab.select",
		tabId: i.id
	}), m = d({
		type: "tab.remove",
		tabId: i.id
	});
	return /* @__PURE__ */ s("div", {
		ref: (e) => void n(e),
		className: "tab selected",
		"data-layman-component": "tab",
		"data-layman-tab": i.id,
		"data-layman-window": a,
		children: [/* @__PURE__ */ o("button", {
			className: "tab-selector",
			type: "button",
			disabled: p.kind === "deny",
			onMouseDown: l,
			onClick: u,
			children: f(i, a, !0)
		}), /* @__PURE__ */ o("button", {
			type: "button",
			"aria-label": `Close ${i.title}`,
			className: "close-tab",
			disabled: m.kind === "deny",
			onClick: c,
			children: /* @__PURE__ */ o(t, {})
		})]
	});
};
//#endregion
export { l as SingleTab, c as Tab };
