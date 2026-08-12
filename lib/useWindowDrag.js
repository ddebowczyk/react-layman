import { LaymanContext as e } from "./LaymanContext.js";
import { windowDragType as t } from "./dnd/items.js";
import { isFloatingAddress as n } from "./utils.js";
import { useContext as r, useEffect as i, useState as a } from "react";
import { useDrag as o, useDragLayer as s } from "react-dnd";
//#region src/useWindowDrag.ts
function c({ windowId: c, path: l, position: u, tabs: d, selectedTabId: f }) {
	let { canExecute: p, layoutDispatch: m, setGlobalDragging: h, setWindowDragStartPosition: g, setDraggedWindowTabs: _ } = r(e), [v, y] = a({
		top: 0,
		left: 0
	}), [b, x] = a({
		x: 0,
		y: 0
	}), S = (e) => {
		n(l) && !e.didDrop() && m({
			type: "floating.position",
			windowId: c,
			position: {
				top: u.top + v.top,
				left: u.left + v.left,
				width: u.width,
				height: u.height
			}
		}), _([]), g({
			x: 0,
			y: 0
		});
	}, C = {
		type: t,
		item: {
			id: c,
			path: l,
			tabs: d,
			selectedTabId: f
		},
		canDrag: () => p(n(l) ? {
			type: "floating.position",
			windowId: c,
			position: u
		} : {
			type: "window.move",
			windowId: c,
			target: { kind: "root" },
			placement: "center"
		}).kind === "allow",
		collect: (e) => ({ isDragging: e.isDragging() }),
		end: (e, t) => S(t)
	}, [{ isDragging: w }, T, E] = o(C), [{ isDragging: D }, O, k] = o(C);
	i(() => {
		if (typeof Image > "u") return;
		let e = new Image();
		e.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", E(e), k(e);
	}, [E, k]);
	let { clientOffset: A } = s((e) => ({ clientOffset: e.getClientOffset() }));
	return i(() => {
		y(A && (w || D) ? {
			top: A.y - b.y,
			left: A.x - b.x
		} : {
			top: 0,
			left: 0
		});
	}, [
		A,
		b.x,
		b.y,
		w,
		D
	]), i(() => {
		h(w || D);
	}, [
		w,
		D,
		h
	]), i(() => {
		(w || D) && (_(d), g(b));
	}, [
		b,
		w,
		D,
		_,
		g,
		d
	]), {
		currentMousePosition: v,
		drag: T,
		dragStartPosition: b,
		isDragging: w,
		isSingleTabDragging: D,
		setDragStartPosition: x,
		singleTabDrag: O
	};
}
//#endregion
export { c as useWindowDrag };
