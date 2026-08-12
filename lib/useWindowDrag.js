import { LaymanContext as e } from "./LaymanContext.js";
import { windowDragType as t } from "./dnd/items.js";
import { isFloatingAddress as n } from "./utils.js";
import { useContext as r, useEffect as i, useMemo as a, useState as o } from "react";
import { useDrag as s, useDragLayer as c } from "react-dnd";
//#region src/useWindowDrag.ts
function l({ windowId: l, path: u, position: d, tabs: f, selectedTabId: p }) {
	let { canExecute: m, layoutDispatch: h, setGlobalDragging: g, setWindowDragStartPosition: _, setDraggedWindowTabs: v } = r(e), [y, b] = o({
		top: 0,
		left: 0
	}), [x, S] = o({
		x: 0,
		y: 0
	}), C = a(() => {
		let e = new Image();
		return e.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", e;
	}, []), w = (e) => {
		n(u) && !e.didDrop() && h({
			type: "floating.position",
			windowId: l,
			position: {
				top: d.top + y.top,
				left: d.left + y.left,
				width: d.width,
				height: d.height
			}
		}), v([]), _({
			x: 0,
			y: 0
		});
	}, T = {
		type: t,
		item: {
			id: l,
			path: u,
			tabs: f,
			selectedTabId: p
		},
		canDrag: () => m(n(u) ? {
			type: "floating.position",
			windowId: l,
			position: d
		} : {
			type: "window.move",
			windowId: l,
			target: { kind: "root" },
			placement: "center"
		}).kind === "allow",
		collect: (e) => ({ isDragging: e.isDragging() }),
		end: (e, t) => w(t)
	}, [{ isDragging: E }, D, O] = s(T), [{ isDragging: k }, A, j] = s(T);
	i(() => {
		O(C), j(C);
	}, [
		O,
		C,
		j
	]);
	let { clientOffset: M } = c((e) => ({ clientOffset: e.getClientOffset() }));
	return i(() => {
		b(M && (E || k) ? {
			top: M.y - x.y,
			left: M.x - x.x
		} : {
			top: 0,
			left: 0
		});
	}, [
		M,
		x.x,
		x.y,
		E,
		k
	]), i(() => {
		g(E || k);
	}, [
		E,
		k,
		g
	]), i(() => {
		(E || k) && (v(f), _(x));
	}, [
		x,
		E,
		k,
		v,
		_,
		f
	]), {
		currentMousePosition: y,
		drag: D,
		dragStartPosition: x,
		isDragging: E,
		isSingleTabDragging: k,
		setDragStartPosition: S,
		singleTabDrag: A
	};
}
//#endregion
export { l as useWindowDrag };
