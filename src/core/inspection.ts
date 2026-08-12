import type {JsonValue, LaymanNode, LaymanState, LaymanTree} from "./model";

export interface LaymanInspectedTab<TData extends JsonValue = JsonValue> {
    id: string;
    title: string;
    data: TData;
}

export interface LaymanInspectedWindow<TData extends JsonValue = JsonValue> {
    id: string;
    location: "tiled" | "floating";
    parentSplitId: string | null;
    siblingIds: readonly string[];
    selectedTabId: string | null;
    tabs: readonly LaymanInspectedTab<TData>[];
    position?: Readonly<{top: number; left: number; width: number; height: number}>;
    zIndex?: number;
}

export interface LaymanInspectedSplit {
    id: string;
    parentSplitId: string | null;
    direction: "column" | "row";
    childIds: readonly string[];
}

export interface LaymanInspection<TData extends JsonValue = JsonValue> {
    rootId: string | null;
    windows: readonly LaymanInspectedWindow<TData>[];
    splits: readonly LaymanInspectedSplit[];
}

function cloneData<TData extends JsonValue>(data: TData): TData {
    return JSON.parse(JSON.stringify(data)) as TData;
}

function inspectedTabs<TData extends JsonValue>(tabs: readonly {id: string; title: string; data: TData}[]): LaymanInspectedTab<TData>[] {
    return tabs.map((tab) => ({id: tab.id, title: tab.title, data: cloneData(tab.data)}));
}

function inspectTree<TData extends JsonValue>(
    tree: LaymanTree<TData>,
    parent: LaymanNode<TData> | null,
    windows: LaymanInspectedWindow<TData>[],
    splits: LaymanInspectedSplit[]
): void {
    if ("tabs" in tree) {
        windows.push({
            id: tree.id,
            location: "tiled",
            parentSplitId: parent?.id ?? null,
            siblingIds: parent ? parent.children.filter((child) => child.id !== tree.id).map((child) => child.id) : [],
            selectedTabId: tree.selectedTabId,
            tabs: inspectedTabs(tree.tabs),
        });
        return;
    }
    splits.push({id: tree.id, parentSplitId: parent?.id ?? null, direction: tree.direction, childIds: tree.children.map((child) => child.id)});
    tree.children.forEach((child) => inspectTree(child, tree, windows, splits));
}

/** Builds a detached, JSON-friendly view of the complete layout graph. */
export function inspectLaymanState<TData extends JsonValue>(state: LaymanState<TData>): LaymanInspection<TData> {
    const windows: LaymanInspectedWindow<TData>[] = [];
    const splits: LaymanInspectedSplit[] = [];
    if (state.layout) inspectTree(state.layout, null, windows, splits);
    state.floatingWindows.forEach((window) => {
        windows.push({
            id: window.id,
            location: "floating",
            parentSplitId: null,
            siblingIds: [],
            selectedTabId: window.selectedTabId,
            tabs: inspectedTabs(window.tabs),
            position: {...window.position},
            zIndex: window.zIndex,
        });
    });
    return {rootId: state.layout?.id ?? null, windows, splits};
}
