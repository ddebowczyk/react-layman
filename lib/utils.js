//#region src/utils.ts
function e(e) {
	return !Array.isArray(e);
}
function t(t) {
	return e(t) ? `float-${t.floatingId}` : t.length == 0 ? "root" : t.join(":");
}
function n(e, t) {
	if (e === t) return !0;
	if (typeof e == "number" && typeof t == "number") return Number.isNaN(e) && Number.isNaN(t);
	if (e === null || t === null || typeof e != "object" || typeof t != "object") return !1;
	let r = Array.isArray(e), i = Array.isArray(t);
	if (r !== i) return !1;
	if (r && i) {
		if (e.length !== t.length) return !1;
		for (let r = 0; r < e.length; r++) if (!n(e[r], t[r])) return !1;
		return !0;
	}
	if (e instanceof Date && t instanceof Date) return e.getTime() === t.getTime();
	if (e instanceof RegExp && t instanceof RegExp) return e.source === t.source && e.flags === t.flags;
	let a = e, o = t, s = Object.keys(a), c = Object.keys(o);
	if (s.length !== c.length) return !1;
	for (let e of s) if (!Object.prototype.hasOwnProperty.call(o, e) || !n(a[e], o[e])) return !1;
	return !0;
}
//#endregion
export { t as addressKey, n as deepEqual, e as isFloatingAddress };
