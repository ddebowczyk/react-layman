import { deserializeState as e, serializeState as t } from "../layoutSnapshot.js";
//#region src/integration/bridge.ts
function n(e) {
	return e instanceof Error ? e.message : String(e);
}
function r(e) {
	return typeof e.revision == "number" && Number.isSafeInteger(e.revision) && e.revision >= 1 && typeof e.originId == "string" && e.originId.trim().length > 0;
}
function i(i) {
	if (!i.workspaceId.trim()) throw Error("[Layman] workspaceId must not be empty");
	if (!i.originId.trim()) throw Error("[Layman] originId must not be empty");
	let a = /* @__PURE__ */ new Set();
	i.onEvent && a.add(i.onEvent);
	let o = 0, s = !1, c, l, u = Promise.resolve(), d = Promise.resolve(), f = 0, p = (e) => a.forEach((t) => t(e)), m = (a) => {
		if (a.status !== "applied" || a.meta.origin === "restore") return;
		let s = {
			epoch: f,
			snapshot: t(a.next)
		};
		u = u.then(async () => {
			if (s.epoch !== f) return;
			let t = o;
			try {
				let a = await i.snapshots.compareAndSave(i.workspaceId, {
					expectedRevision: t,
					originId: i.originId,
					snapshot: s.snapshot
				});
				if (a.status === "saved") {
					if (!r(a.update) || a.update.originId !== i.originId || a.update.revision <= t) throw Error("compareAndSave returned an invalid saved record");
					o = a.update.revision;
					return;
				}
				if (f += 1, !r(a.current) || a.current.revision <= t) {
					p({
						type: "save-conflict-failed",
						workspaceId: i.workspaceId,
						expectedRevision: t,
						message: "compareAndSave returned an invalid current record"
					});
					return;
				}
				try {
					let n = e(a.current.snapshot), r = i.controller.replaceState(n, {
						origin: "restore",
						requestId: a.current.originId
					});
					o = a.current.revision, p({
						type: "save-conflicted",
						workspaceId: i.workspaceId,
						expectedRevision: t,
						currentRevision: o,
						transition: r
					});
				} catch (e) {
					p({
						type: "save-conflict-failed",
						workspaceId: i.workspaceId,
						expectedRevision: t,
						message: n(e)
					});
				}
			} catch (e) {
				p({
					type: "save-failed",
					workspaceId: i.workspaceId,
					message: n(e)
				});
			}
		});
	}, h = (e) => {
		p({
			type: "transition",
			transition: e
		}), m(e);
	}, g = (t) => {
		if (!r(t)) {
			p({
				type: "external-update-failed",
				workspaceId: i.workspaceId,
				message: "update revision and originId are required"
			});
			return;
		}
		if (t.originId === i.originId) {
			p({
				type: "external-update-ignored",
				workspaceId: i.workspaceId,
				revision: t.revision,
				reason: "echo"
			});
			return;
		}
		if (t.revision <= o) {
			p({
				type: "external-update-ignored",
				workspaceId: i.workspaceId,
				revision: t.revision,
				reason: "stale"
			});
			return;
		}
		try {
			let n = e(t.snapshot), r = i.controller.replaceState(n, {
				origin: "restore",
				requestId: t.originId
			});
			return o = t.revision, f += 1, p({
				type: "external-update-applied",
				workspaceId: i.workspaceId,
				revision: o,
				transition: r
			}), r;
		} catch (e) {
			p({
				type: "external-update-failed",
				workspaceId: i.workspaceId,
				message: n(e)
			});
			return;
		}
	}, _ = async (e, t) => {
		let r = i.modules;
		if (!r) return p({
			type: "module-failed",
			workspaceId: i.workspaceId,
			operation: e,
			message: "module host is not configured"
		}), !1;
		try {
			return e === "open" ? await r.open(t) : await r[e](t), !0;
		} catch (t) {
			return p({
				type: "module-failed",
				workspaceId: i.workspaceId,
				operation: e,
				message: n(t)
			}), !1;
		}
	};
	return {
		controller: i.controller,
		start() {
			return d = d.then(async () => {
				if (!s) {
					s = !0;
					try {
						let t = await i.snapshots.load(i.workspaceId);
						if (t) {
							if (!r(t)) throw Error("update revision and originId are required");
							let n = e(t.snapshot);
							o = t.revision, i.controller.replaceState(n, {
								origin: "restore",
								requestId: t.originId
							});
						}
						p({
							type: "restored",
							workspaceId: i.workspaceId,
							revision: o
						});
					} catch (e) {
						p({
							type: "load-failed",
							workspaceId: i.workspaceId,
							message: n(e)
						});
					}
					if (c = i.controller.subscribe(h), i.snapshots.subscribe) try {
						l = await i.snapshots.subscribe(i.workspaceId, (e) => {
							s && g(e);
						});
					} catch (e) {
						p({
							type: "subscribe-failed",
							workspaceId: i.workspaceId,
							message: n(e)
						});
					}
				}
			}), d;
		},
		stop() {
			return d = d.then(async () => {
				if (s) {
					s = !1, c?.(), c = void 0;
					try {
						await l?.();
					} catch (e) {
						p({
							type: "subscribe-failed",
							workspaceId: i.workspaceId,
							message: n(e)
						});
					}
					l = void 0, await u;
				}
			}), d;
		},
		flush: () => u,
		inspect() {
			let e = i.controller.getState();
			return {
				workspaceId: i.workspaceId,
				revision: o,
				layout: i.controller.inspect(),
				snapshot: t(e)
			};
		},
		dispatch(e, t) {
			return i.controller.dispatch(e, {
				origin: "tauri",
				requestId: t
			});
		},
		replaceState(e, t) {
			return i.controller.replaceState(e, {
				origin: "tauri",
				requestId: t
			});
		},
		receive: g,
		openModule: (e) => _("open", e),
		focusModule: (e) => _("focus", e),
		closeModule: (e) => _("close", e),
		subscribe(e) {
			return a.add(e), () => a.delete(e);
		}
	};
}
//#endregion
export { i as createLaymanWorkspaceBridge };
