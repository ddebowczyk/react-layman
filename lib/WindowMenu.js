import { LaymanContext as e } from "./LaymanContext.js";
import { CloseIcon as t, EllipsisIcon as n } from "./Icons.js";
import { ToolbarButton as r } from "./ToolbarButton.js";
import { useContext as i } from "react";
import { jsx as a, jsxs as o } from "react/jsx-runtime";
//#region src/WindowMenu.tsx
function s({ windowId: s, position: c, tabs: l, selectedTabId: u, open: d, setOpen: f, controls: p }) {
	let { canExecute: m, layoutDispatch: h, renderTab: g, metrics: _ } = i(e), { toolbarHeight: v, separatorThickness: y } = _, b = v;
	return /* @__PURE__ */ o("div", {
		className: "layman-window-menu",
		style: {
			position: "absolute",
			top: c.top + y,
			left: c.left + c.width - b - y,
			zIndex: 8
		},
		"data-layman-component": "window-menu",
		"data-layman-window": s,
		children: [/* @__PURE__ */ a(r, {
			className: "toolbar-button layman-window-menu-trigger",
			"aria-label": d ? "Close window controls" : "Open window controls",
			"aria-expanded": d,
			onClick: () => f(!d),
			style: {
				width: b,
				height: b
			},
			children: /* @__PURE__ */ a(n, {})
		}), d && /* @__PURE__ */ o("div", {
			className: "layman-window-menu-popover",
			children: [/* @__PURE__ */ a("div", {
				className: "layman-window-menu-tabs",
				children: l.map((e) => /* @__PURE__ */ o("div", {
					className: `layman-window-menu-tab ${e.id === u ? "selected" : ""}`,
					children: [/* @__PURE__ */ a("button", {
						type: "button",
						className: "tab-selector",
						disabled: m({
							type: "tab.select",
							tabId: e.id
						}).kind === "deny",
						onClick: () => {
							h({
								type: "tab.select",
								tabId: e.id
							}), f(!1);
						},
						children: g(e, s, e.id === u)
					}), /* @__PURE__ */ a("button", {
						type: "button",
						"aria-label": `Close ${e.title}`,
						className: "close-tab",
						disabled: m({
							type: "tab.remove",
							tabId: e.id
						}).kind === "deny",
						onClick: () => h({
							type: "tab.remove",
							tabId: e.id
						}),
						children: /* @__PURE__ */ a(t, {})
					})]
				}, e.id))
			}), /* @__PURE__ */ a("div", {
				className: "layman-window-menu-controls",
				children: p
			})]
		})]
	});
}
//#endregion
export { s as WindowMenu };
