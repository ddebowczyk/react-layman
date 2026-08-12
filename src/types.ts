import type {Dispatch, SetStateAction} from "react";
import type {LaymanCommand} from "./core/commands";
import type {LaymanInspection} from "./core/inspection";
import type {
    FloatingWindowData,
    JsonValue,
    LaymanDirection,
    LaymanLayout,
    LaymanTab,
    Position,
} from "./core/model";
import type {LaymanCommandAuthorizer, LaymanControllerTransition} from "./controller/types";
import type {LaymanToolbarConfig} from "./toolbar/types";

export type {
    FloatingWindowData,
    JsonPrimitive,
    JsonValue,
    LaymanChildren as Children,
    LaymanDirection,
    LaymanLayout,
    LaymanNode,
    LaymanPlacement,
    LaymanState,
    LaymanTab,
    LaymanTree,
    LaymanWindow,
    Position,
} from "./core/model";

/** A private render path. Public commands use stable IDs instead. */
export type LaymanPath = readonly number[];

export interface FloatingWindowAddress {
    floatingId: string;
}

export type WindowAddress = LaymanPath | FloatingWindowAddress;

export interface DragTab {
    tab: LaymanTab;
    path?: WindowAddress;
}

export interface DragWindow {
    id: string;
    tabs: readonly LaymanTab[];
    path: WindowAddress;
    selectedTabId: string | null;
}

export type DragData = DragTab | DragWindow;

export interface SeparatorProps {
    splitId: string;
    nodePosition: Position;
    position: Position;
    index: number;
    direction: LaymanDirection;
    path: LaymanPath;
    separators?: readonly SeparatorProps[];
}

export interface ToolBarProps {
    windowId: string;
    path: WindowAddress;
    position: Position;
    tabs: readonly LaymanTab[];
    selectedTabId: string | null;
    zIndex?: number;
}

export interface WindowProps {
    windowId: string;
    position: Position;
    path: WindowAddress;
    tab: LaymanTab;
    isSelected: boolean;
    zIndex?: number;
}

export type PaneRenderer = (tab: LaymanTab, windowId: string, selected: boolean) => JSX.Element;
export type TabRenderer = (tab: LaymanTab, windowId: string, selected: boolean) => string | JSX.Element;

export interface LaymanContextType {
    globalContainerSize: Position;
    setGlobalContainerSize: Dispatch<SetStateAction<Position>>;
    layout: LaymanLayout;
    layoutDispatch: (command: LaymanCommand) => LaymanControllerTransition;
    setDropHighlightPosition: Dispatch<Position>;
    globalDragging: boolean;
    setGlobalDragging: Dispatch<boolean>;
    draggedWindowTabs: readonly LaymanTab[];
    setDraggedWindowTabs: Dispatch<SetStateAction<readonly LaymanTab[]>>;
    windowDragStartPosition: {x: number; y: number};
    setWindowDragStartPosition: Dispatch<SetStateAction<{x: number; y: number}>>;
    renderPane: PaneRenderer;
    renderTab: TabRenderer;
    canExecute: LaymanCommandAuthorizer;
    toolbar: LaymanToolbarConfig;
    inspection: LaymanInspection;
    renderNull: () => JSX.Element;
    maximizedWindowId: string | null;
    setMaximizedWindowId: Dispatch<SetStateAction<string | null>>;
    floatingWindows: readonly FloatingWindowData[];
    maxDepth: number;
    showTabs: boolean;
    viewId: string;
    ariaLabel?: string;
}

export type LaymanSchemaVersion = 2;
export interface LaymanSerializedTab extends LaymanTab<JsonValue> {}
export interface LaymanSerializedWindow {
    kind: "window";
    id: string;
    tabs: readonly LaymanSerializedTab[];
    selectedTabId: string | null;
    viewPercent?: number;
}
export interface LaymanSerializedNode {
    kind: "node";
    id: string;
    direction: LaymanDirection;
    viewPercent?: number;
    children: readonly LaymanSerializedTree[];
}
export type LaymanSerializedTree = LaymanSerializedWindow | LaymanSerializedNode;
export type LaymanSerializedLayout = LaymanSerializedTree | null;
export interface LaymanSerializedFloatingWindow {
    id: string;
    tabs: readonly LaymanSerializedTab[];
    selectedTabId: string | null;
    position: Position;
    zIndex: number;
}
export interface LaymanSerializedState {
    schemaVersion: LaymanSchemaVersion;
    layout: LaymanSerializedLayout;
    floatingWindows: readonly LaymanSerializedFloatingWindow[];
}
