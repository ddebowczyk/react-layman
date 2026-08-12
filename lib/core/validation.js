//#region src/core/validation.ts
function e(t, n = /* @__PURE__ */ new Set()) {
	if (t === null || typeof t == "string" || typeof t == "boolean") return !0;
	if (typeof t == "number") return Number.isFinite(t);
	if (!t || typeof t != "object" || n.has(t)) return !1;
	n.add(t);
	let r = Array.isArray(t) ? t.every((t) => e(t, n)) : (Object.getPrototypeOf(t) === Object.prototype || Object.getPrototypeOf(t) === null) && Object.values(t).every((t) => e(t, n));
	return n.delete(t), r;
}
function t(e) {
	return e.trim().length > 0;
}
function n(e) {
	return [
		e.top,
		e.left,
		e.width,
		e.height
	].every(Number.isFinite) && e.width > 0 && e.height > 0;
}
function r(e) {
	return e === void 0 || typeof e == "number" && Number.isFinite(e) && e > 0;
}
function i(i) {
	let a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = (n) => {
		if ("tabs" in n) {
			t(n.id) || a.add("empty-id"), s.has(n.id) && a.add("duplicate-window-id"), l.has(n.id) && a.add("duplicate-layout-id"), s.add(n.id), l.add(n.id);
			let i = /* @__PURE__ */ new Set();
			for (let r of n.tabs) t(r.id) || a.add("empty-id"), o.has(r.id) && a.add("duplicate-tab-id"), o.add(r.id), i.has(r.id) && a.add("duplicate-tab-id"), i.add(r.id), e(r.data) || a.add("invalid-tab-data");
			(n.tabs.length === 0 && n.selectedTabId !== null || n.tabs.length > 0 && !i.has(n.selectedTabId ?? "")) && a.add("invalid-selection"), r(n.viewPercent) || a.add("invalid-view-percent");
			return;
		}
		t(n.id) || a.add("empty-id"), c.has(n.id) && a.add("duplicate-split-id"), l.has(n.id) && a.add("duplicate-layout-id"), c.add(n.id), l.add(n.id), r(n.viewPercent) || a.add("invalid-view-percent"), n.children.forEach(u);
	};
	i.layout && u(i.layout);
	for (let r of i.floatingWindows) {
		t(r.id) || a.add("empty-id"), s.has(r.id) && a.add("duplicate-window-id"), l.has(r.id) && a.add("duplicate-layout-id"), s.add(r.id), l.add(r.id);
		let i = /* @__PURE__ */ new Set();
		for (let n of r.tabs) t(n.id) || a.add("empty-id"), o.has(n.id) && a.add("duplicate-tab-id"), o.add(n.id), i.has(n.id) && a.add("duplicate-tab-id"), i.add(n.id), e(n.data) || a.add("invalid-tab-data");
		(r.tabs.length === 0 && r.selectedTabId !== null || r.tabs.length > 0 && !i.has(r.selectedTabId ?? "")) && a.add("invalid-selection"), n(r.position) || a.add("invalid-position"), Number.isFinite(r.zIndex) || a.add("invalid-z-index");
	}
	return {
		valid: a.size === 0,
		issues: [...a]
	};
}
//#endregion
export { e as isJsonValue, n as isValidFloatingPosition, r as isValidViewPercent, i as validateLaymanState };
