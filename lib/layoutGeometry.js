//#region src/layoutGeometry.ts
function e(e, t) {
	let n = [];
	function r(e, t, i) {
		if (!e) return;
		if ("tabs" in e) {
			n.push({
				windowId: e.id,
				path: i,
				position: t
			});
			return;
		}
		let { direction: a, children: o } = e, s = 0;
		o.forEach((e, n) => {
			if (!e) return;
			let c = e.viewPercent ?? 100 / o.length, l = a === "row" ? t.width * (c / 100) : t.height * (c / 100);
			r(e, a === "row" ? {
				top: t.top,
				left: t.left + s,
				width: l,
				height: t.height
			} : {
				top: t.top + s,
				left: t.left,
				width: t.width,
				height: l
			}, i.concat([n])), s += l;
		});
	}
	return r(e, {
		top: 0,
		left: 0,
		width: t.width,
		height: t.height
	}, []), n;
}
function t(t, n, r) {
	let i = e(t, n);
	for (let e = i.length - 1; e >= 0; e--) {
		let t = i[e], { position: n } = t;
		if (r.x >= n.left && r.x <= n.left + n.width && r.y >= n.top && r.y <= n.top + n.height) return t;
	}
	return null;
}
//#endregion
export { t as findWindowRectAtPoint };
