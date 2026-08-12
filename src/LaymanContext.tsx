import React, {createContext, useState} from "react";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {DropHighlight} from "./DropHighlight";
import type {LaymanCommand} from "./core/commands";
import {
    LaymanContextType,
    LaymanState,
    PaneRenderer,
    Position,
    TabRenderer,
    ToolbarButtonType,
    WindowAddress,
} from "./types";

const defaultContextValue: LaymanContextType = {
    globalContainerSize: {top: 0, left: 0, width: 0, height: 0},
    setGlobalContainerSize: () => {},
    layout: undefined,
    layoutDispatch: () => {},
    setDropHighlightPosition: () => {},
    globalDragging: false,
    setGlobalDragging: () => {},
    draggedWindowTabs: [],
    setDraggedWindowTabs: () => {},
    windowDragStartPosition: {x: 0, y: 0},
    setWindowDragStartPosition: () => {},
    renderPane: () => <></>,
    renderTab: () => <></>,
    mutable: true,
    toolbarButtons: [],
    renderNull: () => <></>,
    maximizedPath: null,
    setMaximizedPath: () => {},
    floatingWindows: [],
    maxDepth: Infinity,
    showTabs: true,
    viewId: "layman",
    ariaLabel: undefined,
};

interface LaymanRuntimeProps {
    state: LaymanState;
    dispatch(command: LaymanCommand): void;
    renderPane: PaneRenderer;
    renderTab: TabRenderer;
    renderNull: () => JSX.Element;
    mutable: boolean;
    maxDepth: number;
    showTabs: boolean;
    viewId: string;
    ariaLabel?: string;
    children: React.ReactNode;
}

const defaultToolbarButtons: readonly ToolbarButtonType[] = ["splitBottom", "splitRight", "maximize", "float", "close"];

/** Internal React runtime. Public hosts use LaymanView. */
export const LaymanRuntime = ({
    state,
    dispatch,
    renderPane,
    renderTab,
    renderNull,
    mutable,
    maxDepth,
    showTabs,
    viewId,
    ariaLabel,
    children,
}: LaymanRuntimeProps) => {
    const [globalContainerSize, setGlobalContainerSize] = useState<Position>({top: 0, left: 0, width: 0, height: 0});
    const [dropHighlightPosition, setDropHighlightPosition] = useState<Position>({top: 0, left: 0, width: 0, height: 0});
    const [draggedWindowTabs, setDraggedWindowTabs] = useState<LaymanContextType["draggedWindowTabs"]>([]);
    const [windowDragStartPosition, setWindowDragStartPosition] = useState({x: 0, y: 0});
    const [globalDragging, setGlobalDragging] = useState(false);
    const [maximizedPath, setMaximizedPath] = useState<WindowAddress | null>(null);

    return (
        <LaymanContext.Provider
            value={{
                globalContainerSize,
                setGlobalContainerSize,
                layout: state.layout,
                layoutDispatch: (command) => {
                    dispatch(command);
                },
                setDropHighlightPosition,
                globalDragging,
                setGlobalDragging,
                draggedWindowTabs,
                setDraggedWindowTabs,
                windowDragStartPosition,
                setWindowDragStartPosition,
                renderPane,
                renderTab,
                mutable,
                toolbarButtons: defaultToolbarButtons,
                renderNull,
                maximizedPath,
                setMaximizedPath,
                floatingWindows: state.floatingWindows,
                maxDepth,
                showTabs,
                viewId,
                ariaLabel,
            }}
        >
            <DndProvider backend={HTML5Backend}>
                <DropHighlight position={dropHighlightPosition} isDragging={globalDragging} />
                <div id={`${viewId}-drag-window-border`}></div>
                {children}
            </DndProvider>
        </LaymanContext.Provider>
    );
};

export const LaymanContext = createContext<LaymanContextType>(defaultContextValue);
