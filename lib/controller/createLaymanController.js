import { validateLaymanState as e } from "../core/validation.js";
import { applyLaymanCommand as t } from "../core/engine.js";
import { inspectLaymanState as n } from "../core/inspection.js";
//#region src/controller/createLaymanController.ts
function r(e, t) {
	return {
		origin: t,
		...e
	};
}
function i(i) {
	let a = e(i.state);
	if (!a.valid) throw Error(`[Layman] controller state is invalid: ${a.issues.join(", ")}`);
	let o = i.state, s = i, c = i.interaction, l = 0, u = /* @__PURE__ */ new Set(), d = (e) => {
		e.status === "applied" && s.onStateChange?.(e.next, e), s.onTransition?.(e), u.forEach((t) => t(e));
	}, f = (e, t) => {
		let r = t?.origin ?? "host";
		return c?.canExecute({
			command: e,
			inspection: n(o),
			origin: r,
			view: t?.view
		}) ?? { kind: "allow" };
	};
	return {
		canExecute: f,
		dispatch(e, n) {
			let i = f(e, n);
			if (i.kind === "deny") {
				let t = {
					kind: "command",
					status: "rejected",
					reason: "forbidden",
					denial: i,
					command: e,
					meta: r(n, "host"),
					revision: l,
					previous: o,
					next: o,
					changes: []
				};
				return d(t), t;
			}
			let a = t(o, e);
			a.status === "applied" && (o = a.next), a.status === "applied" && (l += 1);
			let s = {
				kind: "command",
				status: a.status,
				reason: a.reason,
				command: e,
				meta: r(n, "host"),
				revision: l,
				previous: a.previous,
				next: a.next,
				changes: a.changes
			};
			return d(s), s;
		},
		replaceState(t, n) {
			let i = e(t), a = i.valid && t !== o;
			a && (l += 1);
			let s = {
				kind: "state.replace",
				status: i.valid ? a ? "applied" : "noop" : "rejected",
				reason: i.valid ? void 0 : "invalid-state",
				meta: r(n, "host"),
				revision: l,
				previous: o,
				next: i.valid ? t : o,
				changes: []
			};
			return a && (o = t), d(s), s;
		},
		getState: () => o,
		inspect: () => n(o),
		subscribe(e) {
			return u.add(e), () => u.delete(e);
		},
		sync(t, n) {
			let r = e(t);
			if (!r.valid) throw Error(`[Layman] controller state is invalid: ${r.issues.join(", ")}`);
			o = t, s = n, c = n.interaction;
		}
	};
}
function a(e) {
	return i(e);
}
//#endregion
export { a as createLaymanController, i as createLaymanControllerStore };
