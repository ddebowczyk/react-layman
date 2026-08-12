//#region src/core/inspection.ts
function e(e) {
	return JSON.parse(JSON.stringify(e));
}
function t(t) {
	return t.map((t) => ({
		id: t.id,
		title: t.title,
		data: e(t.data)
	}));
}
function n(e, r, i, a) {
	if ("tabs" in e) {
		i.push({
			id: e.id,
			location: "tiled",
			parentSplitId: r?.id ?? null,
			siblingIds: r ? r.children.filter((t) => t.id !== e.id).map((e) => e.id) : [],
			selectedTabId: e.selectedTabId,
			tabs: t(e.tabs)
		});
		return;
	}
	a.push({
		id: e.id,
		parentSplitId: r?.id ?? null,
		direction: e.direction,
		childIds: e.children.map((e) => e.id)
	}), e.children.forEach((t) => n(t, e, i, a));
}
function r(e) {
	let r = [], i = [];
	return e.layout && n(e.layout, null, r, i), e.floatingWindows.forEach((e) => {
		r.push({
			id: e.id,
			location: "floating",
			parentSplitId: null,
			siblingIds: [],
			selectedTabId: e.selectedTabId,
			tabs: t(e.tabs),
			position: { ...e.position },
			zIndex: e.zIndex
		});
	}), {
		rootId: e.layout?.id ?? null,
		windows: r,
		splits: i
	};
}
//#endregion
export { r as inspectLaymanState };
