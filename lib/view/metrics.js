//#region src/view/metrics.ts
var e = {
	separatorThickness: 4,
	toolbarHeight: 32,
	dockZoneInset: 16,
	floatingResizeHandleSize: 8
};
function t(e, t, n) {
	let r = Number.parseFloat(e.getPropertyValue(t));
	return Number.isFinite(r) ? r : n;
}
function n(n) {
	let r = getComputedStyle(n);
	return {
		separatorThickness: t(r, "--layman-separator-thickness", e.separatorThickness),
		toolbarHeight: t(r, "--layman-toolbar-height", e.toolbarHeight),
		dockZoneInset: t(r, "--layman-dock-zone-inset", e.dockZoneInset),
		floatingResizeHandleSize: t(r, "--layman-floating-resize-handle-size", e.floatingResizeHandleSize)
	};
}
function r(e, t) {
	return e.separatorThickness === t.separatorThickness && e.toolbarHeight === t.toolbarHeight && e.dockZoneInset === t.dockZoneInset && e.floatingResizeHandleSize === t.floatingResizeHandleSize;
}
//#endregion
export { e as defaultLaymanViewMetrics, n as readLaymanViewMetrics, r as sameLaymanViewMetrics };
