import type {FloatingWindowData, LaymanTab, Position} from "./types";

export function nextFloatingZIndex(windows: FloatingWindowData[]): number {
    return windows.reduce((highest, window) => Math.max(highest, window.zIndex), 29) + 1;
}

export function addFloatingTab(windows: FloatingWindowData[], id: string, tab: LaymanTab): FloatingWindowData[] {
    return windows.map((window) => (window.id === id ? {...window, tabs: [...window.tabs, tab]} : window));
}

export function removeFloatingTab(windows: FloatingWindowData[], id: string, tab: LaymanTab): FloatingWindowData[] {
    const source = windows.find((window) => window.id === id);
    if (!source) return windows;
    const removedIndex = source.tabs.findIndex((currentTab) => currentTab.id === tab.id);
    if (removedIndex === -1) return windows;

    const tabs = source.tabs.filter((currentTab) => currentTab.id !== tab.id);
    if (tabs.length === 0) return windows.filter((window) => window.id !== id);

    const selectedTabId =
        source.selectedTabId === tab.id ? tabs[Math.min(removedIndex, tabs.length - 1)]?.id ?? null : source.selectedTabId;
    return windows.map((window) => (window.id === id ? {...window, tabs, selectedTabId} : window));
}

export function selectFloatingTab(windows: FloatingWindowData[], id: string, tab: LaymanTab): FloatingWindowData[] {
    return windows.map((window) =>
        window.id === id && window.tabs.some((currentTab) => currentTab.id === tab.id) ? {...window, selectedTabId: tab.id} : window
    );
}

export function removeFloatingWindow(windows: FloatingWindowData[], id: string): FloatingWindowData[] {
    return windows.filter((window) => window.id !== id);
}

export function setFloatingWindowPosition(windows: FloatingWindowData[], id: string, position: Position): FloatingWindowData[] {
    return windows.map((window) => (window.id === id ? {...window, position} : window));
}

export function bringFloatingWindowToFront(windows: FloatingWindowData[], id: string): FloatingWindowData[] {
    const highestZIndex = windows.reduce((highest, window) => Math.max(highest, window.zIndex), 29);
    const target = windows.find((window) => window.id === id);
    if (!target || (target.zIndex === highestZIndex && highestZIndex !== 29)) return windows;
    return windows.map((window) => (window.id === id ? {...window, zIndex: highestZIndex + 1} : window));
}
