import type {ComponentType} from "react";
import type {LaymanCommand} from "../core/commands";
import type {JsonValue, LaymanTab} from "../core/model";
import type {LaymanController, LaymanControllerTransition} from "../controller/types";

export type LaymanCommandDispatcher<TData extends JsonValue> = (
    command: LaymanCommand<TData>
) => LaymanControllerTransition<TData>;

interface LaymanSlotBase<TData extends JsonValue> {
    controller: LaymanController<TData>;
    dispatch: LaymanCommandDispatcher<TData>;
}

export interface LaymanPaneProps<TData extends JsonValue> extends LaymanSlotBase<TData> {
    tab: LaymanTab<TData>;
    windowId: string;
    selected: boolean;
}

export interface LaymanTabProps<TData extends JsonValue> extends LaymanSlotBase<TData> {
    tab: LaymanTab<TData>;
    windowId: string;
    selected: boolean;
}

export interface LaymanEmptyProps<TData extends JsonValue> extends LaymanSlotBase<TData> {}

export interface LaymanInteractionPolicy<TData extends JsonValue> {
    mutable?: boolean;
    canExecute?: (command: LaymanCommand<TData>) => boolean;
}

export interface LaymanViewConfig<TData extends JsonValue> {
    viewId: string;
    ariaLabel?: string;
    maxDepth?: number;
    showTabs?: boolean;
    interaction?: LaymanInteractionPolicy<TData>;
}

export interface LaymanComponents<TData extends JsonValue> {
    Pane: ComponentType<LaymanPaneProps<TData>>;
    Tab: ComponentType<LaymanTabProps<TData>>;
    Empty?: ComponentType<LaymanEmptyProps<TData>>;
}
