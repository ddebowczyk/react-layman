import { ReactNode } from 'react';
import { LaymanInspection } from '../core/inspection';
import { JsonValue, LaymanTab } from '../core/model';
import { LaymanCommandAuthorizer, LaymanCommandDispatcher, LaymanControllerTransition } from '../controller/types';
export type LaymanToolbarLocation = "tiled" | "floating";
export type LaymanToolbarPlacement = "bar" | "overflow" | "both";
export type LaymanToolbarSurface = "bar" | "overflow" | "compact";
export type LaymanBuiltinToolbarAction = "tab.create" | "window.split.top" | "window.split.bottom" | "window.split.left" | "window.split.right" | "window.maximize" | "window.float" | "window.close";
export interface LaymanToolbarWindow<TData extends JsonValue = JsonValue> {
    id: string;
    tabs: readonly LaymanTab<TData>[];
    selectedTabId: string | null;
    location: LaymanToolbarLocation;
}
export interface LaymanToolbarContext<TData extends JsonValue = JsonValue> {
    viewId: string;
    window: Readonly<LaymanToolbarWindow<TData>>;
    inspection: LaymanInspection<TData>;
    isMaximized: boolean;
    dispatch: LaymanCommandDispatcher<TData>;
    canExecute: LaymanCommandAuthorizer<TData>;
}
export interface LaymanToolbarItemState {
    visible: boolean;
    disabled: boolean;
    disabledReason?: string;
    label?: string;
    active?: boolean;
}
export type LaymanToolbarActionResult<TData extends JsonValue = JsonValue> = LaymanControllerTransition<TData> | undefined;
export interface LaymanToolbarWidgetProps<TData extends JsonValue = JsonValue> {
    context: LaymanToolbarContext<TData>;
    item: Readonly<LaymanToolbarItem<TData>>;
    state: Readonly<LaymanToolbarItemState>;
    invoke: () => LaymanToolbarActionResult<TData>;
}
export interface LaymanBuiltinToolbarItem<TData extends JsonValue = JsonValue> {
    kind: "builtin";
    id: string;
    action: LaymanBuiltinToolbarAction;
    placement?: LaymanToolbarPlacement;
    render?: (props: LaymanToolbarWidgetProps<TData>) => ReactNode;
}
export interface LaymanCustomToolbarItem<TData extends JsonValue = JsonValue> {
    kind: "custom";
    id: string;
    placement?: LaymanToolbarPlacement;
    render: (props: LaymanToolbarWidgetProps<TData>) => ReactNode;
}
export type LaymanToolbarItem<TData extends JsonValue = JsonValue> = LaymanBuiltinToolbarItem<TData> | LaymanCustomToolbarItem<TData>;
export type LaymanToolbarItemsResolver<TData extends JsonValue = JsonValue> = readonly LaymanToolbarItem<TData>[] | ((context: LaymanToolbarContext<TData>) => readonly LaymanToolbarItem<TData>[]);
export interface LaymanToolbarConfig<TData extends JsonValue = JsonValue> {
    items: LaymanToolbarItemsResolver<TData>;
    createTab?: (context: LaymanToolbarContext<TData>) => LaymanTab<TData>;
    overflow?: "never" | "auto";
}
