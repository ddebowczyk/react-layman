import type {LaymanChange, LaymanCommand, LaymanRejectionReason, LaymanTransition, WindowTarget} from "./commands";
import {findNode, findTabWindow, findWindow} from "./indexing";
import type {FloatingWindowData, JsonValue, LaymanPlacement, LaymanState, LaymanTab, LaymanWindow, Position} from "./model";
import {autoArrangeTree, createWindowId, insertTreeWindow, removeTreeWindow, replaceTreeAtPath, updateTreeWindow} from "./tree";
import {isJsonValue, validateLaymanState} from "./validation";

function rejected<TData extends JsonValue>(
    previous: LaymanState<TData>,
    command: LaymanCommand<TData>,
    reason: LaymanRejectionReason
): LaymanTransition<TData> {
    return {command, status: "rejected", reason, previous, next: previous, changes: []};
}

function completed<TData extends JsonValue>(
    previous: LaymanState<TData>,
    command: LaymanCommand<TData>,
    next: LaymanState<TData>,
    changes: readonly LaymanChange[]
): LaymanTransition<TData> {
    return {command, status: next === previous ? "noop" : "applied", previous, next, changes: next === previous ? [] : changes};
}

function isFinitePosition(position: Position): boolean {
    return [position.top, position.left, position.width, position.height].every(Number.isFinite);
}

function isId(value: string): boolean {
    return value.trim().length > 0;
}

function hasLayoutId<TData extends JsonValue>(state: LaymanState<TData>, id: string): boolean {
    return Boolean(findWindow(state, id) || findNode(state, id));
}

function newWindowId<TData extends JsonValue>(state: LaymanState<TData>, tabId: string, requestedId?: string): string | undefined {
    if (requestedId !== undefined) return isId(requestedId) && !hasLayoutId(state, requestedId) ? requestedId : undefined;
    let suffix = 1;
    let candidate = createWindowId(state.layout, tabId);
    while (hasLayoutId(state, candidate)) {
        suffix += 1;
        candidate = createWindowId(state.layout, `${tabId}-${suffix}`);
    }
    return candidate;
}

function isValidInsertedTab<TData extends JsonValue>(tab: LaymanTab<TData>): boolean {
    return isId(tab.id) && typeof tab.title === "string" && isJsonValue(tab.data);
}

function removeFloatingTab<TData extends JsonValue>(
    windows: readonly FloatingWindowData<TData>[],
    id: string,
    tabId: string
): readonly FloatingWindowData<TData>[] {
    return windows.flatMap((window) => {
        if (window.id !== id) return [window];
        const index = window.tabs.findIndex((tab) => tab.id === tabId);
        if (index === -1) return [window];
        const tabs = window.tabs.filter((tab) => tab.id !== tabId);
        if (tabs.length === 0) return [];
        const selectedTabId = window.selectedTabId === tabId ? tabs[Math.min(index, tabs.length - 1)].id : window.selectedTabId;
        return [{...window, tabs, selectedTabId}];
    });
}

function removeTab<TData extends JsonValue>(state: LaymanState<TData>, windowId: string, tabId: string): LaymanState<TData> {
    const location = findWindow(state, windowId);
    if (!location) return state;
    if (location.kind === "floating") {
        return {...state, floatingWindows: removeFloatingTab(state.floatingWindows, windowId, tabId)};
    }
    const layout = updateTreeWindow(state.layout, location.path!, (window) => {
        const index = window.tabs.findIndex((tab) => tab.id === tabId);
        if (index === -1) return window;
        const tabs = window.tabs.filter((tab) => tab.id !== tabId);
        if (tabs.length === 0) return undefined;
        return {
            ...window,
            tabs,
            selectedTabId: window.selectedTabId === tabId ? tabs[Math.min(index, tabs.length - 1)].id : window.selectedTabId,
        };
    });
    return layout === state.layout ? state : {...state, layout};
}

function removeWindow<TData extends JsonValue>(state: LaymanState<TData>, windowId: string): LaymanState<TData> {
    const location = findWindow(state, windowId);
    if (!location) return state;
    if (location.kind === "floating") {
        return {...state, floatingWindows: state.floatingWindows.filter((window) => window.id !== windowId)};
    }
    const layout = removeTreeWindow(state.layout, location.path!);
    return layout === state.layout ? state : {...state, layout};
}

function appendTabs<TData extends JsonValue>(state: LaymanState<TData>, windowId: string, tabs: readonly LaymanTab<TData>[]): LaymanState<TData> {
    const location = findWindow(state, windowId);
    if (!location) return state;
    if (location.kind === "floating") {
        return {
            ...state,
            floatingWindows: state.floatingWindows.map((window) => (window.id === windowId ? {...window, tabs: [...window.tabs, ...tabs]} : window)),
        };
    }
    const layout = updateTreeWindow(state.layout, location.path!, (window) => ({...window, tabs: [...window.tabs, ...tabs]}));
    return layout === state.layout ? state : {...state, layout};
}

function insertWindow<TData extends JsonValue>(
    state: LaymanState<TData>,
    target: WindowTarget,
    window: LaymanWindow<TData>,
    placement: Exclude<LaymanPlacement, "center">
): LaymanState<TData> | undefined {
    if (target.kind === "root") {
        if (!state.layout) return {...state, layout: window};
        return {...state, layout: insertTreeWindow(state.layout, [], window, placement)};
    }
    const location = findWindow(state, target.windowId);
    if (!location || location.kind !== "tiled") return undefined;
    return {...state, layout: insertTreeWindow(state.layout, location.path!, window, placement)};
}

function resolveTarget<TData extends JsonValue>(state: LaymanState<TData>, target: WindowTarget): "root" | string | undefined {
    if (target.kind === "root") return "root";
    return findWindow(state, target.windowId) ? target.windowId : undefined;
}

function tabInsert<TData extends JsonValue>(state: LaymanState<TData>, command: Extract<LaymanCommand<TData>, {type: "tab.insert"}>): LaymanTransition<TData> {
    if (!isValidInsertedTab(command.tab)) return rejected(state, command, "invalid-tab");
    if (findTabWindow(state, command.tab.id)) return rejected(state, command, "duplicate-id");
    const target = resolveTarget(state, command.target);
    if (!target || (target === "root" && state.layout && command.placement === "center")) return rejected(state, command, "invalid-target");

    if (command.placement === "center") {
        if (target === "root") {
            const id = newWindowId(state, command.tab.id, command.windowId);
            if (!id) return rejected(state, command, command.windowId ? "duplicate-id" : "invalid-id");
            const next = {...state, layout: {id, tabs: [command.tab], selectedTabId: command.tab.id}};
            return completed(state, command, next, [{kind: "window", id}, {kind: "tab", id: command.tab.id}]);
        }
        const next = appendTabs(state, target, [command.tab]);
        return completed(state, command, next, [{kind: "window", id: target}, {kind: "tab", id: command.tab.id}]);
    }

    const id = newWindowId(state, command.tab.id, command.windowId);
    if (!id) return rejected(state, command, command.windowId ? "duplicate-id" : "invalid-id");
    const next = insertWindow(state, command.target, {id, tabs: [command.tab], selectedTabId: command.tab.id}, command.placement);
    if (!next) return rejected(state, command, "invalid-target");
    return completed(state, command, next, [{kind: "window", id}, {kind: "tab", id: command.tab.id}]);
}

function tabMove<TData extends JsonValue>(state: LaymanState<TData>, command: Extract<LaymanCommand<TData>, {type: "tab.move"}>): LaymanTransition<TData> {
    const source = findTabWindow(state, command.tabId);
    if (!source) return rejected(state, command, "unknown-tab");
    const tab = source.window.tabs.find((candidate) => candidate.id === command.tabId)!;
    const target = resolveTarget(state, command.target);
    if (!target) return rejected(state, command, "invalid-target");
    if (target === source.window.id && command.placement === "center") return completed(state, command, state, []);
    if (target === "root" && state.layout) return rejected(state, command, "invalid-target");
    if (target === source.window.id && source.window.tabs.length === 1) return completed(state, command, state, []);

    const withoutSource = removeTab(state, source.window.id, tab.id);
    if (command.placement === "center") {
        if (target === "root") {
            const id = newWindowId(withoutSource, tab.id, command.windowId);
            if (!id) return rejected(state, command, command.windowId ? "duplicate-id" : "invalid-id");
            const next = {...withoutSource, layout: {id, tabs: [tab], selectedTabId: tab.id}};
            return completed(state, command, next, [{kind: "tab", id: tab.id}, {kind: "window", id}]);
        }
        const next = appendTabs(withoutSource, target, [tab]);
        return completed(state, command, next, [{kind: "tab", id: tab.id}, {kind: "window", id: target}]);
    }
    const id = newWindowId(withoutSource, tab.id, command.windowId);
    if (!id) return rejected(state, command, command.windowId ? "duplicate-id" : "invalid-id");
    const next = insertWindow(withoutSource, command.target, {id, tabs: [tab], selectedTabId: tab.id}, command.placement);
    if (!next) return rejected(state, command, "invalid-target");
    return completed(state, command, next, [{kind: "tab", id: tab.id}, {kind: "window", id}]);
}

function tabSelect<TData extends JsonValue>(state: LaymanState<TData>, command: Extract<LaymanCommand<TData>, {type: "tab.select"}>): LaymanTransition<TData> {
    const location = findTabWindow(state, command.tabId);
    if (!location) return rejected(state, command, "unknown-tab");
    if (location.window.selectedTabId === command.tabId) return completed(state, command, state, []);
    const next = location.kind === "floating"
        ? {...state, floatingWindows: state.floatingWindows.map((window) => (window.id === location.window.id ? {...window, selectedTabId: command.tabId} : window))}
        : {
              ...state,
              layout: updateTreeWindow(state.layout, location.path!, (window) => ({...window, selectedTabId: command.tabId})),
          };
    return completed(state, command, next, [{kind: "tab", id: command.tabId}, {kind: "window", id: location.window.id}]);
}

function windowMove<TData extends JsonValue>(state: LaymanState<TData>, command: Extract<LaymanCommand<TData>, {type: "window.move"}>): LaymanTransition<TData> {
    const source = findWindow(state, command.windowId);
    if (!source) return rejected(state, command, "unknown-window");
    if (command.target.kind === "floating") {
        if (command.placement !== "center") return rejected(state, command, "invalid-placement");
        if (source.kind === "floating") return completed(state, command, state, []);
        if (!isFinitePosition(command.target.position)) return rejected(state, command, "invalid-position");
        const withoutSource = removeWindow(state, source.window.id);
        const next = {
            ...withoutSource,
            floatingWindows: [
                ...withoutSource.floatingWindows,
                {
                    id: source.window.id,
                    tabs: source.window.tabs,
                    selectedTabId: source.window.selectedTabId,
                    position: command.target.position,
                    zIndex: Math.max(29, ...withoutSource.floatingWindows.map((window) => window.zIndex)) + 1,
                },
            ],
        };
        return completed(state, command, next, [{kind: "window", id: source.window.id}, {kind: "floating-window", id: source.window.id}]);
    }

    const target = resolveTarget(state, command.target);
    if (!target) return rejected(state, command, "invalid-target");
    if (target === source.window.id) return completed(state, command, state, []);
    if (target === "root" && command.placement === "center" && state.layout) return rejected(state, command, "invalid-target");
    if (target !== "root" && command.placement !== "center" && findWindow(state, target)?.kind === "floating") {
        return rejected(state, command, "invalid-placement");
    }

    const withoutSource = removeWindow(state, source.window.id);
    if (command.placement === "center") {
        if (target === "root") {
            const next = {...withoutSource, layout: source.window};
            return completed(state, command, next, [{kind: "window", id: source.window.id}]);
        }
        const next = appendTabs(withoutSource, target, source.window.tabs);
        return completed(state, command, next, [{kind: "window", id: source.window.id}, {kind: "window", id: target}]);
    }
    const next = insertWindow(withoutSource, command.target, source.window, command.placement);
    if (!next) return rejected(state, command, "invalid-target");
    return completed(state, command, next, [{kind: "window", id: source.window.id}]);
}

function splitResize<TData extends JsonValue>(state: LaymanState<TData>, command: Extract<LaymanCommand<TData>, {type: "split.resize"}>): LaymanTransition<TData> {
    const location = findNode(state, command.splitId);
    if (!location) return rejected(state, command, "unknown-split");
    if (!Number.isFinite(command.leadingPercent)) return rejected(state, command, "invalid-size");
    const leading = location.node.children[command.index];
    const trailing = location.node.children[command.index + 1];
    if (!leading || !trailing) return rejected(state, command, "invalid-target");
    const total = (leading.viewPercent ?? 100 / location.node.children.length) + (trailing.viewPercent ?? 100 / location.node.children.length);
    if (command.leadingPercent <= 0 || command.leadingPercent >= total) return rejected(state, command, "invalid-size");
    const children = [...location.node.children];
    children[command.index] = {...leading, viewPercent: command.leadingPercent};
    children[command.index + 1] = {...trailing, viewPercent: total - command.leadingPercent};
    const layout = replaceTreeAtPath(state.layout, location.path, {
        ...location.node,
        children: children as unknown as typeof location.node.children,
    });
    return completed(state, command, {...state, layout}, [{kind: "split", id: command.splitId}]);
}

function floatingPosition<TData extends JsonValue>(state: LaymanState<TData>, command: Extract<LaymanCommand<TData>, {type: "floating.position"}>): LaymanTransition<TData> {
    const location = findWindow(state, command.windowId);
    if (!location || location.kind !== "floating") return rejected(state, command, "unknown-window");
    if (!isFinitePosition(command.position)) return rejected(state, command, "invalid-position");
    if (samePosition(location.window.position, command.position)) return completed(state, command, state, []);
    const next = {...state, floatingWindows: state.floatingWindows.map((window) => (window.id === command.windowId ? {...window, position: command.position} : window))};
    return completed(state, command, next, [{kind: "floating-window", id: command.windowId}]);
}

function samePosition(left: Position, right: Position): boolean {
    return left.top === right.top && left.left === right.left && left.width === right.width && left.height === right.height;
}

function floatingFocus<TData extends JsonValue>(state: LaymanState<TData>, command: Extract<LaymanCommand<TData>, {type: "floating.focus"}>): LaymanTransition<TData> {
    const location = findWindow(state, command.windowId);
    if (!location || location.kind !== "floating") return rejected(state, command, "unknown-window");
    const zIndex = Math.max(...state.floatingWindows.map((window) => window.zIndex));
    if (location.window.zIndex === zIndex) return completed(state, command, state, []);
    const next = {...state, floatingWindows: state.floatingWindows.map((window) => (window.id === command.windowId ? {...window, zIndex: zIndex + 1} : window))};
    return completed(state, command, next, [{kind: "floating-window", id: command.windowId}]);
}

/** Applies one semantic command immutably. Rejections and no-ops retain the exact state reference. */
export function applyLaymanCommand<TData extends JsonValue>(state: LaymanState<TData>, command: LaymanCommand<TData>): LaymanTransition<TData> {
    if (!validateLaymanState(state).valid) return rejected(state, command, "invalid-state");
    switch (command.type) {
        case "tab.insert":
            return tabInsert(state, command);
        case "tab.move":
            return tabMove(state, command);
        case "tab.remove": {
            const source = findTabWindow(state, command.tabId);
            if (!source) return rejected(state, command, "unknown-tab");
            return completed(state, command, removeTab(state, source.window.id, command.tabId), [{kind: "tab", id: command.tabId}]);
        }
        case "tab.select":
            return tabSelect(state, command);
        case "window.move":
            return windowMove(state, command);
        case "window.close":
            return findWindow(state, command.windowId)
                ? completed(state, command, removeWindow(state, command.windowId), [{kind: "window", id: command.windowId}])
                : rejected(state, command, "unknown-window");
        case "split.resize":
            return splitResize(state, command);
        case "layout.autoArrange": {
            const layout = autoArrangeTree(state.layout);
            return completed(state, command, layout === state.layout ? state : {...state, layout}, []);
        }
        case "floating.position":
            return floatingPosition(state, command);
        case "floating.focus":
            return floatingFocus(state, command);
    }
}
