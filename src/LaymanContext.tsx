import React, {createContext, useState} from "react";
import {DropHighlight} from "./DropHighlight";
import type {LaymanCommand} from "./core/commands";
import type {LaymanInspection} from "./core/inspection";
import type {LaymanControllerTransition} from "./controller/types";
import {LaymanDndProvider} from "./dnd/LaymanDndProvider";
import type {LaymanDndConfig} from "./dnd/types";
import {defaultLaymanToolbar} from "./toolbar/defaults";
import type {LaymanToolbarConfig} from "./toolbar/types";
import {
    LaymanContextType,
    LaymanState,
    PaneRenderer,
    Position,
    TabRenderer,
} from "./types";
import {defaultLaymanViewMetrics} from "./view/metrics";
import type {LaymanToolbarFrameProps} from "./view/types";

const defaultContextValue: LaymanContextType = {
    globalContainerSize: {top: 0, left: 0, width: 0, height: 0},
    setGlobalContainerSize: () => {},
    metrics: defaultLaymanViewMetrics,
    setMetrics: () => {},
    layout: undefined,
    layoutDispatch: () => {
        throw new Error("[Layman] a view controller is required");
    },
    setDropHighlightPosition: () => {},
    globalDragging: false,
    setGlobalDragging: () => {},
    draggedWindowTabs: [],
    setDraggedWindowTabs: () => {},
    windowDragStartPosition: {x: 0, y: 0},
    setWindowDragStartPosition: () => {},
    renderPane: () => <></>,
    renderTab: () => <></>,
    canExecute: () => ({kind: "allow"}),
    toolbar: defaultLaymanToolbar,
    inspection: {rootId: null, windows: [], splits: []},
    renderNull: () => <></>,
    maximizedWindowId: null,
    setMaximizedWindowId: () => {},
    floatingWindows: [],
    maxDepth: Infinity,
    showTabs: true,
    viewId: "layman",
    ariaLabel: undefined,
    rootClassName: undefined,
    rootStyle: {},
    dragBorderElement: null,
    setDragBorderElement: () => {},
    renderToolbarFrame: ({children}: LaymanToolbarFrameProps) => children,
};

interface LaymanRuntimeProps {
    state: LaymanState;
    inspection: LaymanInspection;
    dispatch(command: LaymanCommand): LaymanControllerTransition;
    canExecute: LaymanContextType["canExecute"];
    renderPane: PaneRenderer;
    renderTab: TabRenderer;
    renderNull: () => JSX.Element;
    dnd?: LaymanDndConfig;
    maxDepth: number;
    showTabs: boolean;
    toolbar?: LaymanToolbarConfig;
    viewId: string;
    ariaLabel?: string;
    rootClassName?: string;
    rootStyle?: React.CSSProperties;
    renderToolbarFrame?: (props: LaymanToolbarFrameProps) => React.ReactNode;
    children: React.ReactNode;
}

/** Internal React runtime. Public hosts use LaymanView. */
export const LaymanRuntime = ({
    state,
    inspection,
    dispatch,
    renderPane,
    renderTab,
    renderNull,
    canExecute,
    dnd,
    maxDepth,
    showTabs,
    toolbar = defaultLaymanToolbar,
    viewId,
    ariaLabel,
    rootClassName,
    rootStyle = {},
    renderToolbarFrame = ({children}: LaymanToolbarFrameProps) => children,
    children,
}: LaymanRuntimeProps) => {
    const [globalContainerSize, setGlobalContainerSize] = useState<Position>({top: 0, left: 0, width: 0, height: 0});
    const [metrics, setMetrics] = useState(defaultLaymanViewMetrics);
    const [dropHighlightPosition, setDropHighlightPosition] = useState<Position>({top: 0, left: 0, width: 0, height: 0});
    const [draggedWindowTabs, setDraggedWindowTabs] = useState<LaymanContextType["draggedWindowTabs"]>([]);
    const [windowDragStartPosition, setWindowDragStartPosition] = useState({x: 0, y: 0});
    const [globalDragging, setGlobalDragging] = useState(false);
    const [maximizedWindowId, setMaximizedWindowId] = useState<string | null>(null);
    const [dragBorderElement, setDragBorderElement] = useState<HTMLDivElement | null>(null);

    return (
        <LaymanContext.Provider
            value={{
                globalContainerSize,
                setGlobalContainerSize,
                metrics,
                setMetrics,
                layout: state.layout,
                layoutDispatch: dispatch,
                setDropHighlightPosition,
                globalDragging,
                setGlobalDragging,
                draggedWindowTabs,
                setDraggedWindowTabs,
                windowDragStartPosition,
                setWindowDragStartPosition,
                renderPane,
                renderTab,
                canExecute,
                toolbar,
                inspection,
                renderNull,
                maximizedWindowId,
                setMaximizedWindowId,
                floatingWindows: state.floatingWindows,
                maxDepth,
                showTabs,
                viewId,
                ariaLabel,
                rootClassName,
                rootStyle,
                dragBorderElement,
                setDragBorderElement,
                renderToolbarFrame,
            }}
        >
            <LaymanDndProvider config={dnd}>
                <DropHighlight position={dropHighlightPosition} isDragging={globalDragging} />
                {children}
            </LaymanDndProvider>
        </LaymanContext.Provider>
    );
};

export const LaymanContext = createContext<LaymanContextType>(defaultContextValue);
