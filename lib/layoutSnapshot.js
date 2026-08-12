import { isValidFloatingPosition as e, isValidViewPercent as t } from "./core/validation.js";
//#region src/layoutSnapshot.ts
var n = 2;
function r(e) {
	throw Error(`[Layman] invalid layout snapshot: ${e}`);
}
function i(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function a(e, t, n) {
	for (let i of Object.keys(e)) t.includes(i) || r(`${n} contains unknown property '${i}'`);
}
function o(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function s(e, t = /* @__PURE__ */ new Set()) {
	if (e === null || typeof e == "string" || typeof e == "boolean") return e;
	if (typeof e == "number") return Number.isFinite(e) ? e : r("tab data must not contain non-finite numbers");
	if (Array.isArray(e)) {
		if (t.has(e)) return r("tab data must not contain cycles");
		t.add(e);
		let n = e.map((e) => s(e, t));
		return t.delete(e), n;
	}
	if (i(e) && (Object.getPrototypeOf(e) === Object.prototype || Object.getPrototypeOf(e) === null)) {
		if (t.has(e)) return r("tab data must not contain cycles");
		t.add(e);
		let n = {};
		for (let [r, i] of Object.entries(e)) n[r] = s(i, t);
		return t.delete(e), n;
	}
	return r("tab data must be JSON-serializable");
}
function c(e) {
	return JSON.parse(JSON.stringify(e));
}
function l(e) {
	return (!o(e.id) || typeof e.title != "string") && r("tab id and title are required"), {
		id: e.id,
		title: e.title,
		data: c(s(e.data))
	};
}
function u(e) {
	return e ? "tabs" in e ? {
		kind: "window",
		id: e.id,
		tabs: e.tabs.map(l),
		selectedTabId: e.selectedTabId,
		viewPercent: e.viewPercent
	} : {
		kind: "node",
		id: e.id,
		direction: e.direction,
		viewPercent: e.viewPercent,
		children: e.children.map((e) => u(e))
	} : null;
}
function d(e) {
	return {
		id: e.id,
		tabs: e.tabs.map(l),
		selectedTabId: e.selectedTabId,
		position: { ...e.position },
		zIndex: e.zIndex
	};
}
function f(e) {
	let t = u(e);
	return v(t, /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), !0), t;
}
function p(e) {
	let t = d(e);
	return y({
		schemaVersion: 2,
		layout: null,
		floatingWindows: [t]
	}), t;
}
function m(e) {
	let t = {
		schemaVersion: 2,
		layout: u(e.layout),
		floatingWindows: e.floatingWindows.map(d)
	};
	return y(t), t;
}
function h(t, n) {
	i(t) || r(`${n} position is required`), a(t, [
		"top",
		"left",
		"width",
		"height"
	], `${n} position`);
	let { top: o, left: s, width: c, height: l } = t;
	(typeof o != "number" || !Number.isFinite(o)) && r(`${n} position.top must be finite`), (typeof s != "number" || !Number.isFinite(s)) && r(`${n} position.left must be finite`), (typeof c != "number" || !Number.isFinite(c)) && r(`${n} position.width must be finite`), (typeof l != "number" || !Number.isFinite(l)) && r(`${n} position.height must be finite`), e({
		top: o,
		left: s,
		width: c,
		height: l
	}) || r(`${n} position width and height must be greater than zero`);
}
function g(e, t) {
	(!i(e) || !o(e.id) || typeof e.title != "string") && r("tab id and title are required"), a(e, [
		"id",
		"title",
		"data"
	], "tab"), t.has(e.id) && r(`duplicate tab id '${e.id}'`), t.add(e.id), s(e.data);
}
function _(e, t) {
	t !== null && !o(t) && r("selectedTabId must be a string or null"), e.length === 0 && t !== null && r("an empty window must not select a tab"), e.length > 0 && t === null && r("a non-empty window must select a tab"), typeof t == "string" && !e.some((e) => i(e) && e.id === t) && r(`unknown selected tab id '${t}'`);
}
function v(e, n, s, c, l = !1) {
	if (e === null) {
		if (l) return;
		r("split children must be layout trees");
	}
	if ((!i(e) || e.kind !== "window" && e.kind !== "node") && r("layout node kind is required"), a(e, e.kind === "window" ? [
		"kind",
		"id",
		"tabs",
		"selectedTabId",
		"viewPercent"
	] : [
		"kind",
		"id",
		"direction",
		"children",
		"viewPercent"
	], `layout ${e.kind}`), t(e.viewPercent) || r("viewPercent must be a positive finite number"), e.kind === "window") {
		o(e.id) || r("window id is required"), (n.has(e.id) || c.has(e.id)) && r(`duplicate layout id '${e.id}'`), n.add(e.id), Array.isArray(e.tabs) || r("window tabs must be an array"), e.tabs.forEach((e) => g(e, s)), _(e.tabs, e.selectedTabId);
		return;
	}
	(!o(e.id) || e.direction !== "row" && e.direction !== "column" || !Array.isArray(e.children) || e.children.length < 2) && r("split node must have direction and at least two children"), (c.has(e.id) || n.has(e.id)) && r(`duplicate layout id '${e.id}'`), c.add(e.id), e.children.forEach((e) => v(e, n, s, c));
}
function y(e) {
	(!i(e) || e.schemaVersion !== 2 || !Array.isArray(e.floatingWindows)) && r("schemaVersion 2 and floatingWindows are required"), a(e, [
		"schemaVersion",
		"layout",
		"floatingWindows"
	], "snapshot");
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
	v(e.layout, t, n, s, !0), e.floatingWindows.forEach((e, c) => {
		(!i(e) || !o(e.id)) && r(`floating window ${c} id is required`), a(e, [
			"id",
			"tabs",
			"selectedTabId",
			"position",
			"zIndex"
		], `floating window ${c}`), (t.has(e.id) || s.has(e.id)) && r(`duplicate layout id '${e.id}'`), t.add(e.id), Array.isArray(e.tabs) || r(`floating window ${c} tabs must be an array`), e.tabs.forEach((e) => g(e, n)), _(e.tabs, e.selectedTabId), h(e.position, `floating window ${c}`), (typeof e.zIndex != "number" || !Number.isFinite(e.zIndex)) && r(`floating window ${c} zIndex must be finite`);
	});
}
function b(e) {
	return {
		id: e.id,
		title: e.title,
		data: c(s(e.data))
	};
}
function x(e) {
	if (e !== null) return e.kind === "window" ? {
		id: e.id,
		tabs: e.tabs.map(b),
		selectedTabId: e.selectedTabId,
		viewPercent: e.viewPercent
	} : {
		id: e.id,
		direction: e.direction,
		viewPercent: e.viewPercent,
		children: e.children.map((e) => x(e))
	};
}
function S(e) {
	return g(e, /* @__PURE__ */ new Set()), b(e);
}
function C(e) {
	return v(e, /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), !0), x(e);
}
function w(e) {
	return y({
		schemaVersion: 2,
		layout: null,
		floatingWindows: [e]
	}), {
		id: e.id,
		tabs: e.tabs.map(b),
		selectedTabId: e.selectedTabId,
		position: { ...e.position },
		zIndex: e.zIndex
	};
}
function T(e) {
	return y(e), {
		layout: x(e.layout),
		floatingWindows: e.floatingWindows.map((e) => ({
			id: e.id,
			tabs: e.tabs.map(b),
			selectedTabId: e.selectedTabId,
			position: { ...e.position },
			zIndex: e.zIndex
		}))
	};
}
//#endregion
export { n as LAYMAN_SNAPSHOT_VERSION, w as deserializeFloatingWindow, C as deserializeLayout, T as deserializeState, S as deserializeTab, p as serializeFloatingWindow, f as serializeLayout, m as serializeState, y as validateLaymanSnapshot };
