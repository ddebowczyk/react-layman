import {Dispatch, SetStateAction} from "react";

// Credit: https://blog.replit.com/leaky-uis
// This is a utility type, a dynamically sized tuple
// that requires at least 2 elements be present. This
// guarantees flatness, i.e. no awkward [[[[A]]]] case
export type Children<T> = [T, T, ...T[]];

export type LaymanDirection = "column" | "row";
export type LaymanPath = Array<number>;

/** A stable, serializable tab that a host application can inspect and control. */
export interface LaymanTab<TData = unknown> {
    id: string;
    title: string;
    data: TData;
}

/** A tiled window with a stable identity and an explicit selected tab. */
export interface LaymanWindow<TData = unknown> {
    id: string;
    viewPercent?: number;
    tabs: LaymanTab<TData>[];
    /** `null` is valid only when `tabs` is empty. */
    selectedTabId: string | null;
}

export interface LaymanNode<TData = unknown> {
    direction: LaymanDirection;
    viewPercent?: number;
    children: Children<LaymanLayout<TData>>;
}

export type LaymanLayout<TData = unknown> = LaymanWindow<TData> | LaymanNode<TData> | undefined;

/** A stable address for a window that is outside the tiled layout tree. */
export interface FloatingWindowAddress {
    floatingId: string;
}

/** A temporary tree path or a stable floating-window address. */
export type WindowAddress = LaymanPath | FloatingWindowAddress;

export interface BaseLaymanLayoutAction {
    type: string;
    path: WindowAddress;
}

export interface AddTabAction extends BaseLaymanLayoutAction {
    type: "addTab";
    tab: LaymanTab;
}

export interface RemoveTabAction extends BaseLaymanLayoutAction {
    type: "removeTab";
    tab: LaymanTab;
}

export interface SelectTabAction extends BaseLaymanLayoutAction {
    type: "selectTab";
    tab: LaymanTab;
}

export interface MoveTabAction extends BaseLaymanLayoutAction {
    type: "moveTab";
    tab: LaymanTab;
    newPath: WindowAddress;
    placement: "top" | "bottom" | "left" | "right" | "center";
}

export interface MoveSeparatorAction {
    type: "moveSeparator";
    path: LaymanPath;
    index: number;
    newSplitPercentage: number;
}

export interface AddWindowAction extends BaseLaymanLayoutAction {
    type: "addWindow";
    window: LaymanWindow;
    placement: "top" | "bottom" | "left" | "right";
}

export interface RemoveWindowAction extends BaseLaymanLayoutAction {
    type: "removeWindow";
}

export interface MoveWindowAction extends BaseLaymanLayoutAction {
    type: "moveWindow";
    newPath: WindowAddress;
    placement: "top" | "bottom" | "left" | "right" | "center";
    position?: Position;
}

export type LaymanHeuristic = "topleft" | "topright";

export interface AddTabActionWithHeuristic {
    type: "addTabWithHeuristic";
    heuristic: LaymanHeuristic;
    tab: LaymanTab;
}

export type AutoArrangeAction = {type: "autoArrange"};

export interface SetFloatingWindowPositionAction {
    type: "setFloatingWindowPosition";
    floatingId: string;
    position: Position;
}

export interface BringFloatingWindowToFrontAction {
    type: "bringFloatingWindowToFront";
    floatingId: string;
}

export type LaymanLayoutAction =
    | AddTabAction
    | RemoveTabAction
    | SelectTabAction
    | MoveTabAction
    | MoveSeparatorAction
    | AddWindowAction
    | RemoveWindowAction
    | MoveWindowAction
    | AddTabActionWithHeuristic
    | AutoArrangeAction
    | SetFloatingWindowPositionAction
    | BringFloatingWindowToFrontAction;

export interface Position {
    top: number;
    left: number;
    width: number;
    height: number;
}

export interface DragTab {
    tab: LaymanTab;
    path?: WindowAddress;
}

export interface DragWindow {
    id: string;
    tabs: LaymanTab[];
    path: WindowAddress;
    selectedTabId: string | null;
}

export type DragData = DragTab | DragWindow;

export interface SeparatorProps {
    nodePosition: Position;
    position: Position;
    index: number;
    direction: LaymanDirection;
    path: LaymanPath;
    separators?: SeparatorProps[];
}

export interface ToolBarProps {
    windowId: string;
    path: WindowAddress;
    position: Position;
    tabs: LaymanTab[];
    selectedTabId: string | null;
    zIndex?: number;
}

export interface WindowProps {
    position: Position;
    path: WindowAddress;
    tab: LaymanTab;
    isSelected: boolean;
    zIndex?: number;
}

export type PaneRenderer = (tab: LaymanTab) => JSX.Element;
export type TabRenderer = (tab: LaymanTab) => string | JSX.Element;

export type ToolbarButtonType =
    | "splitLeft"
    | "splitRight"
    | "splitTop"
    | "splitBottom"
    | "maximize"
    | "minimize"
    | "float"
    | "unfloat"
    | "close"
    | "misc";

export interface LaymanContextType {
    globalContainerSize: Position;
    setGlobalContainerSize: Dispatch<SetStateAction<Position>>;
    layout: LaymanLayout;
    layoutDispatch: React.Dispatch<LaymanLayoutAction>;
    setDropHighlightPosition: React.Dispatch<Position>;
    globalDragging: boolean;
    setGlobalDragging: React.Dispatch<boolean>;
    draggedWindowTabs: LaymanTab[];
    setDraggedWindowTabs: React.Dispatch<LaymanTab[]>;
    windowDragStartPosition: {x: number; y: number};
    setWindowDragStartPosition: React.Dispatch<{x: number; y: number}>;
    renderPane: PaneRenderer;
    renderTab: TabRenderer;
    mutable: boolean;
    toolbarButtons?: ToolbarButtonType[];
    renderNull: JSX.Element;
    maximizedPath: WindowAddress | null;
    setMaximizedPath: React.Dispatch<React.SetStateAction<WindowAddress | null>>;
    floatingWindows: FloatingWindowData[];
    maxDepth: number;
    showTabs: boolean;
}

/** A free-floating window with the same identity and selection rules as tiled windows. */
export interface FloatingWindowData<TData = unknown> {
    id: string;
    tabs: LaymanTab<TData>[];
    selectedTabId: string | null;
    position: Position;
    zIndex: number;
}

export interface LaymanState<TData = unknown> {
    layout: LaymanLayout<TData>;
    floatingWindows: FloatingWindowData<TData>[];
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | {[key: string]: JsonValue};
export type LaymanSchemaVersion = 1;

export interface LaymanSerializedTab extends LaymanTab<JsonValue> {}

export interface LaymanSerializedWindow {
    kind: "window";
    id: string;
    tabs: LaymanSerializedTab[];
    selectedTabId: string | null;
    viewPercent?: number;
}

export interface LaymanSerializedNode {
    kind: "node";
    direction: LaymanDirection;
    viewPercent?: number;
    children: LaymanSerializedLayout[];
}

export type LaymanSerializedLayout = LaymanSerializedWindow | LaymanSerializedNode | null;

export interface LaymanSerializedFloatingWindow {
    id: string;
    tabs: LaymanSerializedTab[];
    selectedTabId: string | null;
    position: Position;
    zIndex: number;
}

export interface LaymanSerializedState {
    schemaVersion: LaymanSchemaVersion;
    layout: LaymanSerializedLayout;
    floatingWindows: LaymanSerializedFloatingWindow[];
}
