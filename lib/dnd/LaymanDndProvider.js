import { DndProvider as e } from "react-dnd";
import { HTML5Backend as t } from "react-dnd-html5-backend";
import { Fragment as n, jsx as r } from "react/jsx-runtime";
//#region src/dnd/LaymanDndProvider.tsx
var i = { mode: "internal" };
function a({ config: a = i, children: o }) {
	return a.mode === "external" ? /* @__PURE__ */ r(n, { children: o }) : a.mode === "manager" ? /* @__PURE__ */ r(e, {
		manager: a.manager,
		children: o
	}) : /* @__PURE__ */ r(e, {
		backend: a.backend ?? t,
		context: a.context,
		options: a.options,
		children: o
	});
}
//#endregion
export { a as LaymanDndProvider };
