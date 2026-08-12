import { findNode as e, findTabWindow as t, findWindow as n } from "./indexing.js";
import { autoArrangeTree as r, createWindowId as i, insertTreeWindow as a, removeTreeWindow as o, replaceTreeAtPath as s, updateTreeWindow as c } from "./tree.js";
import { isJsonValue as l, isValidFloatingPosition as u, validateLaymanState as d } from "./validation.js";
//#region src/core/engine.ts
function f(e, t, n) {
	return {
		command: t,
		status: "rejected",
		reason: n,
		previous: e,
		next: e,
		changes: []
	};
}
function p(e, t, n, r) {
	return {
		command: t,
		status: n === e ? "noop" : "applied",
		previous: e,
		next: n,
		changes: n === e ? [] : r
	};
}
function m(e) {
	return e.trim().length > 0;
}
function h(t, r) {
	return !!(n(t, r) || e(t, r));
}
function g(e, t, n) {
	if (n !== void 0) return m(n) && !h(e, n) ? n : void 0;
	let r = 1, a = i(e.layout, t);
	for (; h(e, a);) r += 1, a = i(e.layout, `${t}-${r}`);
	return a;
}
function _(e) {
	return m(e.id) && typeof e.title == "string" && l(e.data);
}
function v(e, t, n) {
	return e.flatMap((e) => {
		if (e.id !== t) return [e];
		let r = e.tabs.findIndex((e) => e.id === n);
		if (r === -1) return [e];
		let i = e.tabs.filter((e) => e.id !== n);
		if (i.length === 0) return [];
		let a = e.selectedTabId === n ? i[Math.min(r, i.length - 1)].id : e.selectedTabId;
		return [{
			...e,
			tabs: i,
			selectedTabId: a
		}];
	});
}
function y(e, t, r) {
	let i = n(e, t);
	if (!i) return e;
	if (i.kind === "floating") return {
		...e,
		floatingWindows: v(e.floatingWindows, t, r)
	};
	let a = c(e.layout, i.path, (e) => {
		let t = e.tabs.findIndex((e) => e.id === r);
		if (t === -1) return e;
		let n = e.tabs.filter((e) => e.id !== r);
		if (n.length !== 0) return {
			...e,
			tabs: n,
			selectedTabId: e.selectedTabId === r ? n[Math.min(t, n.length - 1)].id : e.selectedTabId
		};
	});
	return a === e.layout ? e : {
		...e,
		layout: a
	};
}
function b(e, t) {
	let r = n(e, t);
	if (!r) return e;
	if (r.kind === "floating") return {
		...e,
		floatingWindows: e.floatingWindows.filter((e) => e.id !== t)
	};
	let i = o(e.layout, r.path);
	return i === e.layout ? e : {
		...e,
		layout: i
	};
}
function x(e, t, r) {
	let i = n(e, t);
	if (!i) return e;
	if (i.kind === "floating") return {
		...e,
		floatingWindows: e.floatingWindows.map((e) => e.id === t ? {
			...e,
			tabs: [...e.tabs, ...r]
		} : e)
	};
	let a = c(e.layout, i.path, (e) => ({
		...e,
		tabs: [...e.tabs, ...r]
	}));
	return a === e.layout ? e : {
		...e,
		layout: a
	};
}
function S(e, t, r, i) {
	if (t.kind === "root") return e.layout ? {
		...e,
		layout: a(e.layout, [], r, i)
	} : {
		...e,
		layout: r
	};
	let o = n(e, t.windowId);
	if (!(!o || o.kind !== "tiled")) return {
		...e,
		layout: a(e.layout, o.path, r, i)
	};
}
function C(e, t) {
	return t.kind === "root" ? "root" : n(e, t.windowId) ? t.windowId : void 0;
}
function w(e, n) {
	if (!_(n.tab)) return f(e, n, "invalid-tab");
	if (t(e, n.tab.id)) return f(e, n, "duplicate-id");
	let r = C(e, n.target);
	if (!r || r === "root" && e.layout && n.placement === "center") return f(e, n, "invalid-target");
	if (n.placement === "center") {
		if (r === "root") {
			let t = g(e, n.tab.id, n.windowId);
			return t ? p(e, n, {
				...e,
				layout: {
					id: t,
					tabs: [n.tab],
					selectedTabId: n.tab.id
				}
			}, [{
				kind: "window",
				id: t
			}, {
				kind: "tab",
				id: n.tab.id
			}]) : f(e, n, n.windowId ? "duplicate-id" : "invalid-id");
		}
		return p(e, n, x(e, r, [n.tab]), [{
			kind: "window",
			id: r
		}, {
			kind: "tab",
			id: n.tab.id
		}]);
	}
	let i = g(e, n.tab.id, n.windowId);
	if (!i) return f(e, n, n.windowId ? "duplicate-id" : "invalid-id");
	let a = S(e, n.target, {
		id: i,
		tabs: [n.tab],
		selectedTabId: n.tab.id
	}, n.placement);
	return a ? p(e, n, a, [{
		kind: "window",
		id: i
	}, {
		kind: "tab",
		id: n.tab.id
	}]) : f(e, n, "invalid-target");
}
function T(e, n) {
	let r = t(e, n.tabId);
	if (!r) return f(e, n, "unknown-tab");
	let i = r.window.tabs.find((e) => e.id === n.tabId), a = C(e, n.target);
	if (!a) return f(e, n, "invalid-target");
	if (a === r.window.id && n.placement === "center") return p(e, n, e, []);
	if (a === "root" && e.layout) return f(e, n, "invalid-target");
	if (a === r.window.id && r.window.tabs.length === 1) return p(e, n, e, []);
	let o = y(e, r.window.id, i.id);
	if (n.placement === "center") {
		if (a === "root") {
			let t = g(o, i.id, n.windowId);
			return t ? p(e, n, {
				...o,
				layout: {
					id: t,
					tabs: [i],
					selectedTabId: i.id
				}
			}, [{
				kind: "tab",
				id: i.id
			}, {
				kind: "window",
				id: t
			}]) : f(e, n, n.windowId ? "duplicate-id" : "invalid-id");
		}
		return p(e, n, x(o, a, [i]), [{
			kind: "tab",
			id: i.id
		}, {
			kind: "window",
			id: a
		}]);
	}
	let s = g(o, i.id, n.windowId);
	if (!s) return f(e, n, n.windowId ? "duplicate-id" : "invalid-id");
	let c = S(o, n.target, {
		id: s,
		tabs: [i],
		selectedTabId: i.id
	}, n.placement);
	return c ? p(e, n, c, [{
		kind: "tab",
		id: i.id
	}, {
		kind: "window",
		id: s
	}]) : f(e, n, "invalid-target");
}
function E(e, n) {
	let r = t(e, n.tabId);
	return r ? r.window.selectedTabId === n.tabId ? p(e, n, e, []) : p(e, n, r.kind === "floating" ? {
		...e,
		floatingWindows: e.floatingWindows.map((e) => e.id === r.window.id ? {
			...e,
			selectedTabId: n.tabId
		} : e)
	} : {
		...e,
		layout: c(e.layout, r.path, (e) => ({
			...e,
			selectedTabId: n.tabId
		}))
	}, [{
		kind: "tab",
		id: n.tabId
	}, {
		kind: "window",
		id: r.window.id
	}]) : f(e, n, "unknown-tab");
}
function D(e, t) {
	let r = n(e, t.windowId);
	if (!r) return f(e, t, "unknown-window");
	if (t.target.kind === "floating") {
		if (t.placement !== "center") return f(e, t, "invalid-placement");
		if (r.kind === "floating") return p(e, t, e, []);
		if (!u(t.target.position)) return f(e, t, "invalid-position");
		let n = b(e, r.window.id);
		return p(e, t, {
			...n,
			floatingWindows: [...n.floatingWindows, {
				id: r.window.id,
				tabs: r.window.tabs,
				selectedTabId: r.window.selectedTabId,
				position: t.target.position,
				zIndex: Math.max(29, ...n.floatingWindows.map((e) => e.zIndex)) + 1
			}]
		}, [{
			kind: "window",
			id: r.window.id
		}, {
			kind: "floating-window",
			id: r.window.id
		}]);
	}
	let i = C(e, t.target);
	if (!i) return f(e, t, "invalid-target");
	if (i === r.window.id) return p(e, t, e, []);
	if (i === "root" && t.placement === "center" && e.layout) return f(e, t, "invalid-target");
	if (i !== "root" && t.placement !== "center" && n(e, i)?.kind === "floating") return f(e, t, "invalid-placement");
	let a = b(e, r.window.id);
	if (t.placement === "center") return i === "root" ? p(e, t, {
		...a,
		layout: r.window
	}, [{
		kind: "window",
		id: r.window.id
	}]) : p(e, t, x(a, i, r.window.tabs), [{
		kind: "window",
		id: r.window.id
	}, {
		kind: "window",
		id: i
	}]);
	let o = S(a, t.target, r.window, t.placement);
	return o ? p(e, t, o, [{
		kind: "window",
		id: r.window.id
	}]) : f(e, t, "invalid-target");
}
function O(t, n) {
	let r = e(t, n.splitId);
	if (!r) return f(t, n, "unknown-split");
	if (!Number.isFinite(n.leadingPercent)) return f(t, n, "invalid-size");
	let i = r.node.children[n.index], a = r.node.children[n.index + 1];
	if (!i || !a) return f(t, n, "invalid-target");
	let o = (i.viewPercent ?? 100 / r.node.children.length) + (a.viewPercent ?? 100 / r.node.children.length);
	if (n.leadingPercent <= 0 || n.leadingPercent >= o) return f(t, n, "invalid-size");
	let c = [...r.node.children];
	c[n.index] = {
		...i,
		viewPercent: n.leadingPercent
	}, c[n.index + 1] = {
		...a,
		viewPercent: o - n.leadingPercent
	};
	let l = s(t.layout, r.path, {
		...r.node,
		children: c
	});
	return p(t, n, {
		...t,
		layout: l
	}, [{
		kind: "split",
		id: n.splitId
	}]);
}
function k(e, t) {
	let r = n(e, t.windowId);
	return !r || r.kind !== "floating" ? f(e, t, "unknown-window") : u(t.position) ? A(r.window.position, t.position) ? p(e, t, e, []) : p(e, t, {
		...e,
		floatingWindows: e.floatingWindows.map((e) => e.id === t.windowId ? {
			...e,
			position: t.position
		} : e)
	}, [{
		kind: "floating-window",
		id: t.windowId
	}]) : f(e, t, "invalid-position");
}
function A(e, t) {
	return e.top === t.top && e.left === t.left && e.width === t.width && e.height === t.height;
}
function j(e, t) {
	let r = n(e, t.windowId);
	if (!r || r.kind !== "floating") return f(e, t, "unknown-window");
	let i = Math.max(...e.floatingWindows.map((e) => e.zIndex));
	return r.window.zIndex === i ? p(e, t, e, []) : p(e, t, {
		...e,
		floatingWindows: e.floatingWindows.map((e) => e.id === t.windowId ? {
			...e,
			zIndex: i + 1
		} : e)
	}, [{
		kind: "floating-window",
		id: t.windowId
	}]);
}
function M(e, i) {
	if (!d(e).valid) return f(e, i, "invalid-state");
	switch (i.type) {
		case "tab.insert": return w(e, i);
		case "tab.move": return T(e, i);
		case "tab.remove": {
			let n = t(e, i.tabId);
			return n ? p(e, i, y(e, n.window.id, i.tabId), [{
				kind: "tab",
				id: i.tabId
			}]) : f(e, i, "unknown-tab");
		}
		case "tab.select": return E(e, i);
		case "window.move": return D(e, i);
		case "window.close": return n(e, i.windowId) ? p(e, i, b(e, i.windowId), [{
			kind: "window",
			id: i.windowId
		}]) : f(e, i, "unknown-window");
		case "split.resize": return O(e, i);
		case "layout.autoArrange": {
			let t = r(e.layout);
			return p(e, i, t === e.layout ? e : {
				...e,
				layout: t
			}, []);
		}
		case "floating.position": return k(e, i);
		case "floating.focus": return j(e, i);
	}
}
//#endregion
export { M as applyLaymanCommand };
