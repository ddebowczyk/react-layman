import type {ComponentType} from "react";
import type {JsonValue, LaymanTab} from "../core/model";
import type {LaymanCommandDispatcher, LaymanController} from "../controller/types";
import type {LaymanDndConfig} from "../dnd/types";
import type {LaymanToolbarConfig} from "../toolbar/types";

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

export interface LaymanViewConfig<TData extends JsonValue> {
    viewId: string;
    ariaLabel?: string;
    maxDepth?: number;
    showTabs?: boolean;
    dnd?: LaymanDndConfig;
    toolbar?: LaymanToolbarConfig<TData>;
}

export interface LaymanComponents<TData extends JsonValue> {
    Pane: ComponentType<LaymanPaneProps<TData>>;
    Tab: ComponentType<LaymanTabProps<TData>>;
    Empty?: ComponentType<LaymanEmptyProps<TData>>;
}
