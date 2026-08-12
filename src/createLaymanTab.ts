import {createLaymanId} from "./laymanId";
import type {JsonValue, LaymanDirection, LaymanNode, LaymanTab, LaymanTree, LaymanWindow} from "./core/model";
import {isJsonValue} from "./core/validation";

function requireId(id: string, label: string): void {
    if (id.trim().length === 0) throw new Error(`[Layman] ${label} id must not be empty`);
}

/** Creates a plain, stable tab value for a Layman layout. */
export function createLaymanTab<TData extends JsonValue>(title: string, data: TData, id = createLaymanId()): LaymanTab<TData> {
    requireId(id, "tab");
    if (typeof title !== "string") throw new Error("[Layman] tab title must be a string");
    if (!isJsonValue(data)) throw new Error("[Layman] tab data must be JSON-serializable");
    return {id, title, data};
}

/** Creates a window with a valid initial selection. */
export function createLaymanWindow<TData extends JsonValue>(
    tabs: readonly LaymanTab<TData>[],
    id = createLaymanId(),
    selectedTabId = tabs[0]?.id ?? null
): LaymanWindow<TData> {
    requireId(id, "window");
    const tabIds = new Set<string>();
    for (const tab of tabs) {
        requireId(tab.id, "tab");
        if (typeof tab.title !== "string") throw new Error("[Layman] tab title must be a string");
        if (!isJsonValue(tab.data)) throw new Error("[Layman] tab data must be JSON-serializable");
        if (tabIds.has(tab.id)) throw new Error(`[Layman] duplicate tab id '${tab.id}'`);
        tabIds.add(tab.id);
    }
    if ((tabs.length === 0 && selectedTabId !== null) || (selectedTabId !== null && !tabIds.has(selectedTabId))) {
        throw new Error("[Layman] selectedTabId must identify a tab in the window");
    }
    return {id, tabs, selectedTabId};
}

/** Creates a split with a stable ID and at least two children. */
export function createLaymanNode<TData extends JsonValue>(
    direction: LaymanDirection,
    children: readonly [LaymanTree<TData>, LaymanTree<TData>, ...LaymanTree<TData>[]],
    id = createLaymanId()
): LaymanNode<TData> {
    requireId(id, "split");
    return {id, direction, children};
}
