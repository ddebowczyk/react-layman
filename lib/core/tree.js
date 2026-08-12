//#region src/core/tree.ts
function e(e, t) {
	return {
		...e,
		viewPercent: t
	};
}
function t(e) {
	if (e.length < 2) throw Error("[Layman] internal tree error: split must have at least two children");
	return e;
}
function n(e, t, n) {
	let r = `${e}-${n.map(encodeURIComponent).join("-")}`, i = r, a = 2;
	for (; t.has(i);) i = `${r}-${a}`, a += 1;
	return i;
}
function r(e, t, r) {
	let { windowIds: i, splitIds: o } = a(e), s = new Set([...i, ...o]);
	return r && !s.has(r) ? r : n("window", s, [t]);
}
function i(e, t, r) {
	let { windowIds: i, splitIds: o } = a(e);
	return n("split", new Set([...i, ...o]), [t, r]);
}
function a(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = (e) => {
		if ("tabs" in e) {
			t.add(e.id);
			return;
		}
		n.add(e.id), e.children.forEach(r);
	};
	return e && r(e), {
		windowIds: t,
		splitIds: n
	};
}
function o(e, n, r) {
	if (!e) return e;
	if (n.length === 0) return r;
	if ("tabs" in e) return e;
	let [i, ...a] = n, s = e.children[i];
	if (!s) return e;
	let c = o(s, a, r);
	if (c === s) return e;
	let l = [...e.children];
	return c ? (l[i] = c, {
		...e,
		children: t(l)
	}) : e;
}
function s(t, n) {
	let r = t[n]?.viewPercent;
	return t.filter((e, t) => t !== n).map((n) => {
		let i = n.viewPercent ?? 100 / t.length;
		return e(n, r ? i * 100 / (100 - r) : i * t.length / (t.length - 1));
	});
}
function c(n, r) {
	return r.length === 1 ? e(r[0], n.viewPercent) : {
		...n,
		children: t(r)
	};
}
function l(e, n) {
	if (!e) return e;
	if (n.length === 0) return;
	if ("tabs" in e) return e;
	let [r, ...i] = n;
	if (i.length === 0) return r < 0 || r >= e.children.length ? e : c(e, s(e.children, r));
	let a = e.children[r];
	if (!a || "tabs" in a) return e;
	let o = l(a, i);
	if (o === a) return e;
	if (!o) return c(e, s(e.children, r));
	let u = [...e.children];
	return u[r] = o, {
		...e,
		children: t(u)
	};
}
function u(e, n, r) {
	if (!e) return e;
	if (n.length === 0) return "tabs" in e ? r(e) : e;
	if ("tabs" in e) return e;
	let [i, ...a] = n, o = e.children[i];
	if (!o) return e;
	let l = u(o, a, r);
	if (l === o) return e;
	if (!l) return c(e, s(e.children, i));
	let d = [...e.children];
	return d[i] = l, {
		...e,
		children: t(d)
	};
}
function d(e) {
	if (e === "left" || e === "right") return "row";
	if (e === "top" || e === "bottom") return "column";
}
function f(n, r, i) {
	let a = n.length, o = n.map((t) => e(t, (t.viewPercent ?? 100 / a) * a / (a + 1)));
	return t([
		...o.slice(0, r),
		{
			...i,
			viewPercent: 100 / (a + 1)
		},
		...o.slice(r)
	]);
}
function p(e, n, r, a) {
	if (!e) return r;
	let o = d(a), s = a === "top" || a === "left";
	if (n.length === 0) return "tabs" in e ? {
		id: i(e, r.id, e.id),
		direction: o,
		children: t(s ? [r, e] : [e, r])
	} : e.direction === o ? {
		...e,
		children: f(e.children, s ? 0 : e.children.length, r)
	} : {
		id: i(e, r.id, e.id),
		direction: o,
		children: t(s ? [r, e] : [e, r])
	};
	if ("tabs" in e) return e;
	let [c, ...l] = n, u = e.children[c];
	if (!u) return e;
	if (l.length > 0) {
		let n = p(u, l, r, a);
		if (n === u || !n) return e;
		let i = [...e.children];
		return i[c] = n, {
			...e,
			children: t(i)
		};
	}
	if (e.direction === o) return {
		...e,
		children: f(e.children, s ? c : c + 1, r)
	};
	let m = {
		id: i(e, r.id, u.id),
		direction: o,
		viewPercent: u.viewPercent,
		children: t(s ? [r, {
			...u,
			viewPercent: 50
		}] : [{
			...u,
			viewPercent: 50
		}, r])
	}, h = [...e.children];
	return h[c] = m, {
		...e,
		children: t(h)
	};
}
function m(e) {
	if (!e || "tabs" in e) return e;
	let n = 100 / e.children.length, r = !1, i = e.children.map((e) => {
		let t = m(e), i = t.viewPercent === n ? t : {
			...t,
			viewPercent: n
		};
		return i !== e && (r = !0), i;
	});
	return r ? {
		...e,
		children: t(i)
	} : e;
}
//#endregion
export { m as autoArrangeTree, r as createWindowId, p as insertTreeWindow, l as removeTreeWindow, o as replaceTreeAtPath, u as updateTreeWindow };
