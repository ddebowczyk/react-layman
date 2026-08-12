import {createLaymanId} from "./laymanId";
import type {LaymanTab, LaymanWindow} from "./types";

function requireId(id: string, label: string): void {
    if (id.trim().length === 0) throw new Error(`[Layman] ${label} id must not be empty`);
}

/** Creates a plain, stable tab value for a Layman layout. */
export function createLaymanTab<TData>(title: string, data: TData, id = createLaymanId()): LaymanTab<TData> {
    requireId(id, "tab");
    return {id, title, data};
}

/** Creates a window with a valid initial selection. */
export function createLaymanWindow<TData>(
    tabs: LaymanTab<TData>[],
    id = createLaymanId(),
    selectedTabId = tabs[0]?.id ?? null
): LaymanWindow<TData> {
    requireId(id, "window");
    const tabIds = new Set<string>();
    for (const tab of tabs) {
        requireId(tab.id, "tab");
        if (tabIds.has(tab.id)) throw new Error(`[Layman] duplicate tab id '${tab.id}'`);
        tabIds.add(tab.id);
    }
    if ((tabs.length === 0 && selectedTabId !== null) || (selectedTabId !== null && !tabIds.has(selectedTabId))) {
        throw new Error("[Layman] selectedTabId must identify a tab in the window");
    }
    return {id, tabs, selectedTabId};
}
