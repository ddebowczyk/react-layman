import { FloatingWindowData, JsonValue, LaymanLayout, LaymanNode, LaymanState, LaymanTree, LaymanWindow } from './model';
export type TreePath = readonly number[];
export interface TiledWindowLocation<TData extends JsonValue = JsonValue> {
    window: LaymanWindow<TData>;
    kind: "tiled";
    path: TreePath;
    parentNodeId: string | null;
}
export interface FloatingWindowLocation<TData extends JsonValue = JsonValue> {
    window: FloatingWindowData<TData>;
    kind: "floating";
    parentNodeId: null;
}
export type WindowLocation<TData extends JsonValue = JsonValue> = TiledWindowLocation<TData> | FloatingWindowLocation<TData>;
export interface NodeLocation<TData extends JsonValue = JsonValue> {
    node: LaymanNode<TData>;
    path: TreePath;
    parentNodeId: string | null;
}
export declare function getTreeAtPath<TData extends JsonValue>(layout: LaymanLayout<TData>, path: TreePath): LaymanTree<TData> | undefined;
export declare function findWindow<TData extends JsonValue>(state: LaymanState<TData>, id: string): WindowLocation<TData> | undefined;
export declare function findNode<TData extends JsonValue>(state: LaymanState<TData>, id: string): NodeLocation<TData> | undefined;
export declare function findTabWindow<TData extends JsonValue>(state: LaymanState<TData>, tabId: string): WindowLocation<TData> | undefined;
