import {createLaymanTab, createLaymanWindow} from "../src/createLaymanTab";
import type {FloatingWindowData, LaymanTab, LaymanWindow} from "../src/types";

export function tab<TData = Record<string, never>>(title: string, data = {} as TData, id?: string): LaymanTab<TData> {
    return createLaymanTab(title, data, id);
}

export function window(id: string, ...tabs: LaymanTab[]): LaymanWindow {
    return createLaymanWindow(tabs, id, tabs[0]?.id ?? null);
}

export function floatingWindow(id: string, ...tabs: LaymanTab[]): FloatingWindowData {
    return {
        id,
        tabs,
        selectedTabId: tabs[0]?.id ?? null,
        position: {top: 0, left: 0, width: 300, height: 200},
        zIndex: 30,
    };
}
