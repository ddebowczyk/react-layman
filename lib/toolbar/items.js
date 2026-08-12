import { builtinToolbarWidgetProps as e } from "./builtinActions.js";
//#region src/toolbar/items.ts
function t(e, t) {
	if (t === "compact") return !0;
	let n = e.placement ?? "bar";
	return n === "both" || n === t;
}
function n(e, t) {
	return {
		context: t,
		item: e,
		state: {
			visible: !0,
			disabled: !1
		},
		invoke: () => void 0
	};
}
function r(e, t) {
	let n = typeof e.items == "function" ? e.items(t) : e.items, r = /* @__PURE__ */ new Set();
	for (let e of n) {
		if (!e.id.trim()) throw Error("[Layman] toolbar item id must not be empty");
		if (r.has(e.id)) throw Error(`[Layman] duplicate toolbar item id '${e.id}'`);
		r.add(e.id);
	}
	return n;
}
function i(t, r) {
	return t.kind === "builtin" ? e(t, r) : n(t, r.context);
}
function a(e, n, r) {
	return e.filter((e) => t(e, r) && i(e, n).state.visible);
}
function o(e, t, n) {
	return a(e, t, n).length > 0;
}
//#endregion
export { o as hasToolbarSurfaceItems, r as resolveToolbarItems, i as toolbarItemProps, a as toolbarItemsForSurface };
