import {createLaymanNode, createLaymanTab, createLaymanWindow} from "../src/createLaymanTab";
import type {FloatingWindowData, JsonValue, LaymanNode, LaymanTab, LaymanTree, LaymanWindow} from "../src/types";

export function tab<TData extends JsonValue = Record<string, never>>(title: string, data = {} as TData, id?: string): LaymanTab<TData> {
    return createLaymanTab(title, data, id);
}

export function window(id: string, ...tabs: LaymanTab[]): LaymanWindow {
    return createLaymanWindow(tabs, id, tabs[0]?.id ?? null);
}

export function node(id: string, direction: "column" | "row", ...children: LaymanTree[]): LaymanNode {
    return createLaymanNode(direction, children as [LaymanTree, LaymanTree, ...LaymanTree[]], id);
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
