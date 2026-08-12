import { JsonValue, LaymanLayout, LaymanPlacement, LaymanWindow } from './model';
import { TreePath } from './indexing';
export declare function createWindowId<TData extends JsonValue>(layout: LaymanLayout<TData>, tabId: string, requestedId?: string): string;
export declare function collectIds<TData extends JsonValue>(layout: LaymanLayout<TData>): {
    windowIds: Set<string>;
    splitIds: Set<string>;
};
export declare function replaceTreeAtPath<TData extends JsonValue>(layout: LaymanLayout<TData>, path: TreePath, replacement: LaymanLayout<TData>): LaymanLayout<TData>;
/** Removes a tiled window and collapses empty split levels. */
export declare function removeTreeWindow<TData extends JsonValue>(layout: LaymanLayout<TData>, path: TreePath): LaymanLayout<TData>;
export declare function updateTreeWindow<TData extends JsonValue>(layout: LaymanLayout<TData>, path: TreePath, update: (window: LaymanWindow<TData>) => LaymanWindow<TData> | undefined): LaymanLayout<TData>;
/** Inserts a window next to a stable target window. */
export declare function insertTreeWindow<TData extends JsonValue>(layout: LaymanLayout<TData>, path: TreePath, window: LaymanWindow<TData>, placement: Exclude<LaymanPlacement, "center">): LaymanLayout<TData>;
export declare function autoArrangeTree<TData extends JsonValue>(layout: LaymanLayout<TData>): LaymanLayout<TData>;
