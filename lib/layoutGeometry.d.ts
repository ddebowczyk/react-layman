import { LaymanLayout, LaymanPath, Position } from './types';
/**
 * Walks a layout tree and returns the computed pixel rectangle of every leaf
 * window, paired with its path. Mirrors the (non-dragging) positioning logic in
 * Layman's `traverseLayout`. Used for hit-testing where a floating window should
 * be dropped when it is un-floated.
 */
export declare function computeWindowRects(layout: LaymanLayout, container: {
    width: number;
    height: number;
}): Array<{
    windowId: string;
    path: LaymanPath;
    position: Position;
}>;
/**
 * Returns the path and pixel rectangle of the leaf window containing the
 * given point, or null if none do. Used both for un-float hit-testing and to
 * size/center the "hovered tiled window" floating dock zone.
 */
export declare function findWindowRectAtPoint(layout: LaymanLayout, container: {
    width: number;
    height: number;
}, point: {
    x: number;
    y: number;
}): {
    windowId: string;
    path: LaymanPath;
    position: Position;
} | null;
/**
 * Returns the path of the leaf window whose rectangle contains the given point,
 * or null if none do.
 */
export declare function findWindowAtPoint(layout: LaymanLayout, container: {
    width: number;
    height: number;
}, point: {
    x: number;
    y: number;
}): LaymanPath | null;
