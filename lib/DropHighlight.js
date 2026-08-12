import { jsx as e } from "react/jsx-runtime";
//#region src/DropHighlight.tsx
function t({ position: t, isDragging: n }) {
	return /* @__PURE__ */ e("div", {
		className: "layman-drop-highlight",
		style: {
			...t,
			visibility: n ? "visible" : "hidden",
			opacity: n ? .2 : 0
		}
	});
}
//#endregion
export { t as DropHighlight };
