import { createLaymanControllerStore as e } from "./createLaymanController.js";
import { useRef as t, useState as n } from "react";
//#region src/controller/useLaymanController.ts
function r() {
	return {
		layout: void 0,
		floatingWindows: []
	};
}
function i(i) {
	let a = i.state !== void 0;
	if (a && i.defaultState !== void 0) throw Error("[Layman] use either state or defaultState, not both");
	if (a && !i.onStateChange) throw Error("[Layman] controlled state requires onStateChange");
	let [o, s] = n(() => i.defaultState ?? r()), c = i.state ?? o, l = t(null);
	if (t(a).current !== a) throw Error("[Layman] controlled mode cannot change after setup");
	let u = (e, t) => {
		a ? i.onStateChange?.(e, t) : s(e);
	}, d = {
		state: c,
		onStateChange: u,
		onTransition: i.onTransition,
		interaction: i.interaction
	};
	return l.current ||= e(d), l.current.sync(c, {
		onStateChange: u,
		onTransition: i.onTransition,
		interaction: i.interaction
	}), l.current;
}
//#endregion
export { i as useLaymanController };
