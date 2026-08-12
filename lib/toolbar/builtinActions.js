import { findWindowRectAtPoint as e } from "../layoutGeometry.js";
//#region src/toolbar/builtinActions.ts
var t = {
	"window.split.top": "top",
	"window.split.bottom": "bottom",
	"window.split.left": "left",
	"window.split.right": "right"
}, n = {
	"tab.create": "Create tab",
	"window.split.top": "Split window above",
	"window.split.bottom": "Split window below",
	"window.split.left": "Split window left",
	"window.split.right": "Split window right",
	"window.maximize": "Maximize window",
	"window.float": "Float window",
	"window.close": "Close window"
};
function r(e, r) {
	if (e in t && r.atMaxDepth) return {
		visible: !1,
		disabled: !0,
		disabledReason: "Maximum split depth reached"
	};
	if ((e === "tab.create" || e in t) && !r.config.createTab) return {
		visible: !0,
		disabled: !0,
		disabledReason: "Toolbar createTab is not configured"
	};
	if (e === "window.close") {
		let e = r.context.canExecute({
			type: "window.close",
			windowId: r.context.window.id
		});
		if (e.kind === "deny") return {
			visible: !0,
			disabled: !0,
			disabledReason: e.reason
		};
	}
	return e === "window.maximize" ? {
		visible: !0,
		disabled: !1,
		label: r.context.isMaximized ? "Restore window" : "Maximize window",
		active: r.context.isMaximized
	} : e === "window.float" ? {
		visible: !0,
		disabled: !1,
		label: r.context.window.location === "floating" ? "Dock window" : "Float window",
		active: r.context.window.location === "floating"
	} : {
		visible: !0,
		disabled: !1,
		label: n[e]
	};
}
function i(e, t) {
	let n = e.config.createTab?.(e.context);
	if (!n) return;
	let r = e.context.dispatch({
		type: "tab.insert",
		tab: n,
		target: {
			kind: "window",
			windowId: e.context.window.id
		},
		placement: t
	});
	return r.status === "applied" && t === "center" && e.context.dispatch({
		type: "tab.select",
		tabId: n.id
	}), r;
}
function a(e) {
	let t = e.context.dispatch({
		type: "window.move",
		windowId: e.context.window.id,
		target: {
			kind: "floating",
			position: e.rawPosition
		},
		placement: "center"
	});
	return t.status === "applied" && e.setMaximized(null), t;
}
function o(t) {
	let { window: n } = t.context, r = {
		x: t.rawPosition.left + t.rawPosition.width / 2,
		y: t.rawPosition.top + t.rawPosition.height / 2
	}, i = t.layout ? e(t.layout, t.container, r) : null;
	return i ? t.context.dispatch({
		type: "window.move",
		windowId: n.id,
		target: {
			kind: "window",
			windowId: i.windowId
		},
		placement: "center"
	}) : t.layout ? void 0 : t.context.dispatch({
		type: "window.move",
		windowId: n.id,
		target: { kind: "root" },
		placement: "center"
	});
}
function s(e, n) {
	switch (e) {
		case "tab.create": return i(n, "center");
		case "window.split.top":
		case "window.split.bottom":
		case "window.split.left":
		case "window.split.right": return i(n, t[e]);
		case "window.maximize":
			n.setMaximized(n.context.isMaximized ? null : n.context.window.id);
			return;
		case "window.float": return n.context.window.location === "floating" ? o(n) : a(n);
		case "window.close": {
			let e = n.context.dispatch({
				type: "window.close",
				windowId: n.context.window.id
			});
			return e.status === "applied" && n.context.isMaximized && n.setMaximized(null), e;
		}
	}
}
function c(e, t) {
	let n = r(e.action, t);
	return {
		context: t.context,
		item: e,
		state: n,
		invoke: () => n.disabled ? void 0 : s(e.action, t)
	};
}
//#endregion
export { c as builtinToolbarWidgetProps };
