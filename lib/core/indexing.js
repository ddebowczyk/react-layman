//#region src/core/indexing.ts
function e(e, n) {
	let r = e.floatingWindows.find((e) => e.id === n);
	return r ? {
		window: r,
		kind: "floating",
		parentNodeId: null
	} : t(e.layout, n);
}
function t(e, n, r = [], i = null) {
	if (e) {
		if ("tabs" in e) return e.id === n ? {
			window: e,
			kind: "tiled",
			path: r,
			parentNodeId: i
		} : void 0;
		for (let i = 0; i < e.children.length; i += 1) {
			let a = t(e.children[i], n, [...r, i], e.id);
			if (a) return a;
		}
	}
}
function n(e, t) {
	return r(e.layout, t);
}
function r(e, t, n = [], i = null) {
	if (!(!e || "tabs" in e)) {
		if (e.id === t) return {
			node: e,
			path: n,
			parentNodeId: i
		};
		for (let i = 0; i < e.children.length; i += 1) {
			let a = r(e.children[i], t, [...n, i], e.id);
			if (a) return a;
		}
	}
}
function i(e, t) {
	return o(e.layout, t) ?? a(e.floatingWindows, t);
}
function a(e, t) {
	let n = e.find((e) => e.tabs.some((e) => e.id === t));
	return n ? {
		window: n,
		kind: "floating",
		parentNodeId: null
	} : void 0;
}
function o(e, t, n = [], r = null) {
	if (e) {
		if ("tabs" in e) return e.tabs.some((e) => e.id === t) ? {
			window: e,
			kind: "tiled",
			path: n,
			parentNodeId: r
		} : void 0;
		for (let r = 0; r < e.children.length; r += 1) {
			let i = o(e.children[r], t, [...n, r], e.id);
			if (i) return i;
		}
	}
}
//#endregion
export { n as findNode, i as findTabWindow, e as findWindow };
