import {createLaymanWindow} from "./createLaymanTab";
import {
    addFloatingTab,
    bringFloatingWindowToFront,
    nextFloatingZIndex,
    removeFloatingTab,
    removeFloatingWindow,
    selectFloatingTab,
    setFloatingWindowPosition,
} from "./floatingWindowState";
import {adjustPathAfterRemoval, getLayoutAtPath} from "./layoutPath";
import {
    addTabToLayout,
    addTabWithHeuristic,
    addWindowToLayout,
    autoArrangeLayout,
    moveLayoutSeparator,
    removeTabFromLayout,
    removeWindowFromLayout,
    selectLayoutTab,
} from "./layoutTree";
import type {
    AddTabAction,
    AddWindowAction,
    FloatingWindowData,
    LaymanLayoutAction,
    LaymanState,
    LaymanTab,
    LaymanWindow,
    MoveTabAction,
    MoveWindowAction,
    RemoveTabAction,
    RemoveWindowAction,
    SelectTabAction,
    WindowAddress,
} from "./types";
import {deepClone, isFloatingAddress} from "./utils";

function sameWindowAddress(left: WindowAddress, right: WindowAddress): boolean {
    if (isFloatingAddress(left) || isFloatingAddress(right)) {
        return isFloatingAddress(left) && isFloatingAddress(right) && left.floatingId === right.floatingId;
    }
    return left.length === right.length && left.every((index, offset) => index === right[offset]);
}

function addTab(state: LaymanState, action: AddTabAction): LaymanState {
    if (isFloatingAddress(action.path)) {
        return {...state, floatingWindows: addFloatingTab(state.floatingWindows, action.path.floatingId, action.tab)};
    }
    return {...state, layout: addTabToLayout(state.layout, action.path, action.tab)};
}

function removeTab(state: LaymanState, action: RemoveTabAction): LaymanState {
    if (isFloatingAddress(action.path)) {
        return {...state, floatingWindows: removeFloatingTab(state.floatingWindows, action.path.floatingId, action.tab)};
    }
    return {...state, layout: removeTabFromLayout(state.layout, action.path, action.tab)};
}

function selectTab(state: LaymanState, action: SelectTabAction): LaymanState {
    if (isFloatingAddress(action.path)) {
        return {...state, floatingWindows: selectFloatingTab(state.floatingWindows, action.path.floatingId, action.tab)};
    }
    return {...state, layout: selectLayoutTab(state.layout, action.path, action.tab)};
}

function removeWindow(state: LaymanState, action: RemoveWindowAction): LaymanState {
    if (isFloatingAddress(action.path)) {
        return {...state, floatingWindows: removeFloatingWindow(state.floatingWindows, action.path.floatingId)};
    }
    return {...state, layout: removeWindowFromLayout(state.layout, action.path)};
}

function addWindow(state: LaymanState, action: AddWindowAction): LaymanState {
    if (isFloatingAddress(action.path)) return state;
    return {...state, layout: addWindowToLayout(state.layout, action.path, action.window, action.placement)};
}

function tabAtAddress(state: LaymanState, path: WindowAddress, id: string): LaymanTab | undefined {
    const window = sourceWindow(state, path);
    return window?.tabs.find((tab) => tab.id === id);
}

function moveTab(state: LaymanState, action: MoveTabAction): LaymanState {
    const isExternalSource = Array.isArray(action.path) && action.path.length === 1 && action.path[0] === -1;
    if (!isExternalSource && sameWindowAddress(action.path, action.newPath) && action.placement === "center") return state;
    const movingTab = isExternalSource ? action.tab : tabAtAddress(state, action.path, action.tab.id);
    if (!movingTab) return state;
    if (isFloatingAddress(action.newPath)) {
        const destinationId = action.newPath.floatingId;
        if (!state.floatingWindows.some((window) => window.id === destinationId)) return state;
        const working = isExternalSource ? state : removeTab(state, {type: "removeTab", path: action.path, tab: movingTab});
        return {...working, floatingWindows: addFloatingTab(working.floatingWindows, destinationId, movingTab)};
    }

    const destination = getLayoutAtPath(state.layout, action.newPath);
    if (!destination || !("tabs" in destination)) return state;
    const working = isExternalSource ? state : removeTab(state, {type: "removeTab", path: action.path, tab: movingTab});
    if (action.placement === "center") {
        return {...working, layout: addTabToLayout(working.layout, action.newPath, movingTab)};
    }
    return {
        ...working,
        layout: addWindowToLayout(working.layout, action.newPath, createLaymanWindow([movingTab]), action.placement),
    };
}

function sourceWindow(state: LaymanState, path: WindowAddress): LaymanWindow | FloatingWindowData | undefined {
    if (isFloatingAddress(path)) return state.floatingWindows.find((window) => window.id === path.floatingId);
    const layout = getLayoutAtPath(state.layout, path);
    return layout && "tabs" in layout ? layout : undefined;
}

function moveWindow(state: LaymanState, action: MoveWindowAction): LaymanState {
    const source = sourceWindow(state, action.path);
    if (!source) return state;

    if (sameWindowAddress(action.path, action.newPath)) return state;
    if (isFloatingAddress(action.newPath)) {
        const destinationId = action.newPath.floatingId;
        if (!state.floatingWindows.some((window) => window.id === destinationId) && !action.position) return state;
    }
    if (!isFloatingAddress(action.newPath)) {
        const destination = getLayoutAtPath(state.layout, action.newPath);
        const canSeedEmptyLayout = isFloatingAddress(action.path) && !state.layout;
        if (action.placement === "center" && (!destination || !("tabs" in destination)) && !canSeedEmptyLayout) return state;
        if (action.placement !== "center" && !destination && !canSeedEmptyLayout) return state;
    }

    let working: LaymanState;
    if (isFloatingAddress(action.path)) {
        working = {...state, floatingWindows: removeFloatingWindow(state.floatingWindows, action.path.floatingId)};
    } else {
        working = {...state, layout: removeWindowFromLayout(state.layout, action.path)};
    }
    const movingWindow: LaymanWindow = {id: source.id, tabs: source.tabs, selectedTabId: source.selectedTabId};

    if (isFloatingAddress(action.newPath)) {
        const destinationId = action.newPath.floatingId;
        const destination = working.floatingWindows.find((window) => window.id === destinationId);
        if (destination) {
            return {
                ...working,
                floatingWindows: working.floatingWindows.map((window) =>
                    window.id === destination.id ? {...window, tabs: [...window.tabs, ...movingWindow.tabs]} : window
                ),
            };
        }
        return {
            ...working,
            floatingWindows: [
                ...working.floatingWindows,
                {
                    id: movingWindow.id,
                    tabs: movingWindow.tabs,
                    selectedTabId: movingWindow.selectedTabId,
                    position: action.position!,
                    zIndex: nextFloatingZIndex(working.floatingWindows),
                },
            ],
        };
    }

    const destinationPath = Array.isArray(action.path)
        ? adjustPathAfterRemoval(state.layout, action.path, action.newPath)
        : action.newPath;
    if (action.placement === "center") {
        let layout = deepClone(working.layout);
        for (const tab of movingWindow.tabs) layout = addTabToLayout(layout, destinationPath, tab);
        return {...working, layout};
    }
    return {...working, layout: addWindowToLayout(working.layout, destinationPath, movingWindow, action.placement)};
}

export function LaymanReducer(state: LaymanState, action: LaymanLayoutAction): LaymanState {
    switch (action.type) {
        case "addTab":
            return addTab(state, action);
        case "removeTab":
            return removeTab(state, action);
        case "selectTab":
            return selectTab(state, action);
        case "moveTab":
            return moveTab(state, action);
        case "addWindow":
            return addWindow(state, action);
        case "removeWindow":
            return removeWindow(state, action);
        case "moveWindow":
            return moveWindow(state, action);
        case "moveSeparator":
            return {...state, layout: moveLayoutSeparator(state.layout, action)};
        case "addTabWithHeuristic":
            return {...state, layout: addTabWithHeuristic(state.layout, action.tab, action.heuristic)};
        case "autoArrange":
            return {...state, layout: autoArrangeLayout(state.layout)};
        case "setFloatingWindowPosition":
            return {...state, floatingWindows: setFloatingWindowPosition(state.floatingWindows, action.floatingId, action.position)};
        case "bringFloatingWindowToFront":
            return {...state, floatingWindows: bringFloatingWindowToFront(state.floatingWindows, action.floatingId)};
        default:
            return state;
    }
}
