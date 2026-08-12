import {findWindowRectAtPoint} from "../layoutGeometry";
import type {LaymanLayout, Position} from "../types";
import type {JsonValue} from "../core/model";
import type {
    LaymanBuiltinToolbarAction,
    LaymanBuiltinToolbarItem,
    LaymanToolbarActionResult,
    LaymanToolbarConfig,
    LaymanToolbarContext,
    LaymanToolbarItemState,
    LaymanToolbarWidgetProps,
} from "./types";

export interface ToolbarActionRuntime<TData extends JsonValue = JsonValue> {
    config: LaymanToolbarConfig<TData>;
    context: LaymanToolbarContext<TData>;
    layout: LaymanLayout<TData>;
    rawPosition: Position;
    container: Position;
    atMaxDepth: boolean;
    setMaximized: (windowId: string | null) => void;
}

const splitPlacement = {
    "window.split.top": "top",
    "window.split.bottom": "bottom",
    "window.split.left": "left",
    "window.split.right": "right",
} as const;

const actionLabel: Record<LaymanBuiltinToolbarAction, string> = {
    "tab.create": "Create tab",
    "window.split.top": "Split window above",
    "window.split.bottom": "Split window below",
    "window.split.left": "Split window left",
    "window.split.right": "Split window right",
    "window.maximize": "Maximize window",
    "window.float": "Float window",
    "window.close": "Close window",
};

function stateFor<TData extends JsonValue>(action: LaymanBuiltinToolbarAction, runtime: ToolbarActionRuntime<TData>): LaymanToolbarItemState {
    if (action in splitPlacement && runtime.atMaxDepth) {
        return {visible: false, disabled: true, disabledReason: "Maximum split depth reached"};
    }
    if ((action === "tab.create" || action in splitPlacement) && !runtime.config.createTab) {
        return {visible: true, disabled: true, disabledReason: "Toolbar createTab is not configured"};
    }
    if (action === "window.close") {
        const decision = runtime.context.canExecute({type: "window.close", windowId: runtime.context.window.id});
        if (decision.kind === "deny") return {visible: true, disabled: true, disabledReason: decision.reason};
    }
    if (action === "window.maximize") {
        return {visible: true, disabled: false, label: runtime.context.isMaximized ? "Restore window" : "Maximize window", active: runtime.context.isMaximized};
    }
    if (action === "window.float") {
        return {visible: true, disabled: false, label: runtime.context.window.location === "floating" ? "Dock window" : "Float window", active: runtime.context.window.location === "floating"};
    }
    return {visible: true, disabled: false, label: actionLabel[action]};
}

function insertTab<TData extends JsonValue>(runtime: ToolbarActionRuntime<TData>, placement: "top" | "bottom" | "left" | "right" | "center") {
    const tab = runtime.config.createTab?.(runtime.context);
    if (!tab) return undefined;
    const transition = runtime.context.dispatch({type: "tab.insert", tab, target: {kind: "window", windowId: runtime.context.window.id}, placement});
    if (transition.status === "applied" && placement === "center") runtime.context.dispatch({type: "tab.select", tabId: tab.id});
    return transition;
}

function floatWindow<TData extends JsonValue>(runtime: ToolbarActionRuntime<TData>) {
    const transition = runtime.context.dispatch({
        type: "window.move",
        windowId: runtime.context.window.id,
        target: {kind: "floating", position: runtime.rawPosition},
        placement: "center",
    });
    if (transition.status === "applied") runtime.setMaximized(null);
    return transition;
}

function dockWindow<TData extends JsonValue>(runtime: ToolbarActionRuntime<TData>) {
    const {window} = runtime.context;
    const center = {x: runtime.rawPosition.left + runtime.rawPosition.width / 2, y: runtime.rawPosition.top + runtime.rawPosition.height / 2};
    const target = runtime.layout ? findWindowRectAtPoint(runtime.layout, runtime.container, center) : null;
    if (!target) {
        return runtime.layout ? undefined : runtime.context.dispatch({type: "window.move", windowId: window.id, target: {kind: "root"}, placement: "center"});
    }
    return runtime.context.dispatch({type: "window.move", windowId: window.id, target: {kind: "window", windowId: target.windowId}, placement: "center"});
}

function invokeBuiltin<TData extends JsonValue>(action: LaymanBuiltinToolbarAction, runtime: ToolbarActionRuntime<TData>): LaymanToolbarActionResult<TData> {
    switch (action) {
        case "tab.create":
            return insertTab(runtime, "center");
        case "window.split.top":
        case "window.split.bottom":
        case "window.split.left":
        case "window.split.right":
            return insertTab(runtime, splitPlacement[action]);
        case "window.maximize":
            runtime.setMaximized(runtime.context.isMaximized ? null : runtime.context.window.id);
            return undefined;
        case "window.float":
            return runtime.context.window.location === "floating" ? dockWindow(runtime) : floatWindow(runtime);
        case "window.close": {
            const transition = runtime.context.dispatch({type: "window.close", windowId: runtime.context.window.id});
            if (transition.status === "applied" && runtime.context.isMaximized) runtime.setMaximized(null);
            return transition;
        }
    }
}

export function builtinToolbarWidgetProps<TData extends JsonValue>(
    item: LaymanBuiltinToolbarItem<TData>,
    runtime: ToolbarActionRuntime<TData>
): LaymanToolbarWidgetProps<TData> {
    const state = stateFor(item.action, runtime);
    return {context: runtime.context, item, state, invoke: () => (state.disabled ? undefined : invokeBuiltin(item.action, runtime))};
}
