import type {ComponentType, ReactNode} from "react";
import type {JsonValue, LaymanTab} from "../core/model";
import type {LaymanCommandDispatcher, LaymanController} from "../controller/types";
import type {LaymanDndConfig} from "../dnd/types";
import type {LaymanToolbarConfig, LaymanToolbarWindow} from "../toolbar/types";
import type {LaymanTheme} from "./theme";

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

/** A visual wrapper around Layman's built-in toolbar behavior. */
export interface LaymanToolbarFrameProps<TData extends JsonValue = JsonValue> {
    window: Readonly<LaymanToolbarWindow<TData>>;
    isMaximized: boolean;
    children: ReactNode;
}

export interface LaymanViewConfig<TData extends JsonValue> {
    viewId: string;
    ariaLabel?: string;
    maxDepth?: number;
    showTabs?: boolean;
    dnd?: LaymanDndConfig;
    toolbar?: LaymanToolbarConfig<TData>;
    theme?: LaymanTheme;
}

export interface LaymanComponents<TData extends JsonValue> {
    Pane: ComponentType<LaymanPaneProps<TData>>;
    Tab: ComponentType<LaymanTabProps<TData>>;
    Empty?: ComponentType<LaymanEmptyProps<TData>>;
    ToolbarFrame?: ComponentType<LaymanToolbarFrameProps<TData>>;
}
