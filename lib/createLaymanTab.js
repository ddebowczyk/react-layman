import { isJsonValue as e } from "./core/validation.js";
import { createLaymanId as t } from "./laymanId.js";
//#region src/createLaymanTab.ts
function n(e, t) {
	if (e.trim().length === 0) throw Error(`[Layman] ${t} id must not be empty`);
}
function r(r, i, a = t()) {
	if (n(a, "tab"), typeof r != "string") throw Error("[Layman] tab title must be a string");
	if (!e(i)) throw Error("[Layman] tab data must be JSON-serializable");
	return {
		id: a,
		title: r,
		data: i
	};
}
function i(r, i = t(), a = r[0]?.id ?? null) {
	n(i, "window");
	let o = /* @__PURE__ */ new Set();
	for (let t of r) {
		if (n(t.id, "tab"), typeof t.title != "string") throw Error("[Layman] tab title must be a string");
		if (!e(t.data)) throw Error("[Layman] tab data must be JSON-serializable");
		if (o.has(t.id)) throw Error(`[Layman] duplicate tab id '${t.id}'`);
		o.add(t.id);
	}
	if (r.length === 0 && a !== null || a !== null && !o.has(a)) throw Error("[Layman] selectedTabId must identify a tab in the window");
	return {
		id: i,
		tabs: r,
		selectedTabId: a
	};
}
function a(e, r, i = t()) {
	return n(i, "split"), {
		id: i,
		direction: e,
		children: r
	};
}
//#endregion
export { a as createLaymanNode, r as createLaymanTab, i as createLaymanWindow };
