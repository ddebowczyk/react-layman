import type {FloatingWindowData, JsonValue, LaymanLayout, LaymanNode, LaymanState, LaymanTree, LaymanWindow} from "./model";

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

export function getTreeAtPath<TData extends JsonValue>(layout: LaymanLayout<TData>, path: TreePath): LaymanTree<TData> | undefined {
    let current = layout;
    for (const index of path) {
        if (!current || !("children" in current)) return undefined;
        current = current.children[index];
    }
    return current;
}

export function findWindow<TData extends JsonValue>(state: LaymanState<TData>, id: string): WindowLocation<TData> | undefined {
    const floating = state.floatingWindows.find((window) => window.id === id);
    if (floating) return {window: floating, kind: "floating", parentNodeId: null};

    return findTreeWindow(state.layout, id);
}

function findTreeWindow<TData extends JsonValue>(
    tree: LaymanLayout<TData>,
    id: string,
    path: TreePath = [],
    parentNodeId: string | null = null
): TiledWindowLocation<TData> | undefined {
    if (!tree) return undefined;
    if ("tabs" in tree) return tree.id === id ? {window: tree, kind: "tiled", path, parentNodeId} : undefined;
    for (let index = 0; index < tree.children.length; index += 1) {
        const found = findTreeWindow(tree.children[index], id, [...path, index], tree.id);
        if (found) return found;
    }
    return undefined;
}

export function findNode<TData extends JsonValue>(state: LaymanState<TData>, id: string): NodeLocation<TData> | undefined {
    return findTreeNode(state.layout, id);
}

function findTreeNode<TData extends JsonValue>(
    tree: LaymanLayout<TData>,
    id: string,
    path: TreePath = [],
    parentNodeId: string | null = null
): NodeLocation<TData> | undefined {
    if (!tree || "tabs" in tree) return undefined;
    if (tree.id === id) return {node: tree, path, parentNodeId};
    for (let index = 0; index < tree.children.length; index += 1) {
        const found = findTreeNode(tree.children[index], id, [...path, index], tree.id);
        if (found) return found;
    }
    return undefined;
}

export function findTabWindow<TData extends JsonValue>(state: LaymanState<TData>, tabId: string): WindowLocation<TData> | undefined {
    return findWindowContainingTab(state.layout, tabId) ?? findFloatingWindowContainingTab(state.floatingWindows, tabId);
}

function findFloatingWindowContainingTab<TData extends JsonValue>(
    windows: readonly FloatingWindowData<TData>[],
    tabId: string
): FloatingWindowLocation<TData> | undefined {
    const window = windows.find((candidate) => candidate.tabs.some((tab) => tab.id === tabId));
    return window ? {window, kind: "floating", parentNodeId: null} : undefined;
}

function findWindowContainingTab<TData extends JsonValue>(
    tree: LaymanLayout<TData>,
    tabId: string,
    path: TreePath = [],
    parentNodeId: string | null = null
): TiledWindowLocation<TData> | undefined {
    if (!tree) return undefined;
    if ("tabs" in tree) {
        return tree.tabs.some((tab) => tab.id === tabId) ? {window: tree, kind: "tiled", path, parentNodeId} : undefined;
    }
    for (let index = 0; index < tree.children.length; index += 1) {
        const found = findWindowContainingTab(tree.children[index], tabId, [...path, index], tree.id);
        if (found) return found;
    }
    return undefined;
}
