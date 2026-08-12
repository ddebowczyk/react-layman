//#region src/view/theme.ts
var e = {
	separatorThickness: "--layman-separator-thickness",
	separatorHandleColor: "--layman-separator-handle-color",
	separatorHandleLength: "--layman-separator-handle-length",
	toolbarHeight: "--layman-toolbar-height",
	toolbarBackground: "--layman-toolbar-background",
	toolbarHoverBackground: "--layman-toolbar-hover-background",
	toolbarButtonHoverBackground: "--layman-toolbar-button-hover-background",
	windowBackground: "--layman-window-background",
	tabTextColor: "--layman-tab-text-color",
	tabFontSize: "--layman-tab-font-size",
	closeTabColor: "--layman-close-tab-color",
	accentColor: "--layman-accent-color",
	indicatorThickness: "--layman-indicator-thickness",
	borderRadius: "--layman-border-radius",
	floatingShadow: "--layman-floating-shadow",
	dockZoneInset: "--layman-dock-zone-inset",
	floatingResizeHandleSize: "--layman-floating-resize-handle-size",
	motionDuration: "--layman-motion-duration"
}, t = new Set([
	"separatorThickness",
	"separatorHandleLength",
	"toolbarHeight",
	"tabFontSize",
	"indicatorThickness",
	"borderRadius",
	"dockZoneInset",
	"floatingResizeHandleSize"
]);
function n(e, n) {
	return typeof n == "number" && t.has(e) ? `${n}px` : String(n);
}
function r(t) {
	if (!t) return {};
	let r = {};
	for (let i of Object.keys(e)) {
		let a = t[i];
		a !== void 0 && (r[e[i]] = n(i, a));
	}
	return r;
}
//#endregion
export { r as laymanThemeStyle };
