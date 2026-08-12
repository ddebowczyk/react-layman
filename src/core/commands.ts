import type {JsonValue, LaymanPlacement, LaymanState, LaymanTab, Position} from "./model";

export type WindowTarget = {kind: "window"; windowId: string} | {kind: "root"};
export type WindowMoveTarget = WindowTarget | {kind: "floating"; position: Position};

export type LaymanCommand<TData extends JsonValue = JsonValue> =
    | {type: "tab.insert"; tab: LaymanTab<TData>; target: WindowTarget; placement: LaymanPlacement; windowId?: string}
    | {type: "tab.move"; tabId: string; target: WindowTarget; placement: LaymanPlacement; windowId?: string}
    | {type: "tab.remove"; tabId: string}
    | {type: "tab.select"; tabId: string}
    | {type: "window.move"; windowId: string; target: WindowMoveTarget; placement: LaymanPlacement}
    | {type: "window.close"; windowId: string}
    | {type: "split.resize"; splitId: string; index: number; leadingPercent: number}
    | {type: "layout.autoArrange"}
    | {type: "floating.position"; windowId: string; position: Position}
    | {type: "floating.focus"; windowId: string};

export type LaymanRejectionReason =
    | "invalid-state"
    | "invalid-id"
    | "invalid-tab"
    | "unknown-tab"
    | "unknown-window"
    | "unknown-split"
    | "invalid-target"
    | "invalid-placement"
    | "invalid-position"
    | "invalid-size"
    | "forbidden"
    | "duplicate-id";

export type LaymanChange =
    | {kind: "tab"; id: string}
    | {kind: "window"; id: string}
    | {kind: "split"; id: string}
    | {kind: "floating-window"; id: string};

export interface LaymanTransition<TData extends JsonValue = JsonValue> {
    command: LaymanCommand<TData>;
    status: "applied" | "noop" | "rejected";
    reason?: LaymanRejectionReason;
    previous: LaymanState<TData>;
    next: LaymanState<TData>;
    changes: readonly LaymanChange[];
}
