import { jsx as e } from "react/jsx-runtime";
//#region src/ToolbarButton.tsx
function t({ children: t, type: n = "button", ...r }) {
	return /* @__PURE__ */ e("button", {
		className: "toolbar-button",
		type: n,
		...r,
		children: t
	});
}
//#endregion
export { t as ToolbarButton };
