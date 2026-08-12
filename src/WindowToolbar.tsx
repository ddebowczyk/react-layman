import {useContext, useEffect, useRef, useState} from "react";
import {EllipsisIcon} from "./Icons";
import {LaymanContext} from "./LaymanContext";
import {ToolbarButton} from "./ToolbarButton";
import {WindowDropTarget} from "./WindowDropTarget";
import {WindowMenu} from "./WindowMenu";
import {SingleTab, Tab} from "./WindowTabs";
import {WindowToolbarWidgets} from "./toolbar/WindowToolbarWidgets";
import type {ToolbarActionRuntime} from "./toolbar/builtinActions";
import {hasToolbarSurfaceItems, resolveToolbarItems} from "./toolbar/items";
import type {Position, ToolBarProps} from "./types";
import {addressKey, isFloatingAddress} from "./utils";
import {useWindowDrag} from "./useWindowDrag";

function usePrevious(value: number) {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}

export function WindowToolbar({windowId, path, position: rawPosition, tabs, selectedTabId, zIndex: floatingZIndex}: ToolBarProps) {
    const {
        layout,
        layoutDispatch,
        canExecute,
        globalContainerSize,
        metrics,
        globalDragging,
        toolbar,
        inspection,
        maximizedWindowId,
        setMaximizedWindowId,
        maxDepth,
        showTabs,
        viewId,
        renderToolbarFrame,
    } = useContext(LaymanContext);
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [overflowOpen, setOverflowOpen] = useState(false);
    const isFloating = isFloatingAddress(path);
    const isMaximized = maximizedWindowId === windowId;
    const position = isMaximized
        ? {top: 0, left: 0, width: globalContainerSize.width, height: globalContainerSize.height}
        : rawPosition;
    const previousTabCount = usePrevious(tabs.length);
    const windowToolbarHeight = showTabs ? metrics.toolbarHeight : 0;
    const {separatorThickness} = metrics;
    const atMaxDepth = isFloating || path.length >= maxDepth;

    useEffect(() => {
        const tabContainer = tabContainerRef.current;
        if (tabs.length > previousTabCount && tabContainer && tabContainer.scrollWidth > tabContainer.clientWidth) {
            tabContainer.scrollLeft = tabContainer.scrollWidth;
        }
    }, [tabs.length, previousTabCount]);

    const handleTabContainerWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        const tabContainer = tabContainerRef.current;
        if (!tabContainer || tabContainer.scrollWidth <= tabContainer.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        tabContainer.scrollLeft += event.deltaY;
    };

    const {
        currentMousePosition,
        drag,
        dragStartPosition,
        isDragging,
        isSingleTabDragging: singleTabIsDragging,
        setDragStartPosition,
        singleTabDrag,
    } = useWindowDrag({windowId, path, position, tabs, selectedTabId});
    const isAnyDragActive = isDragging || singleTabIsDragging;
    const scale = isAnyDragActive && !isFloating ? 0.7 : 1;

    const toolbarContext = {
        viewId,
        window: {id: windowId, tabs, selectedTabId, location: isFloating ? "floating" : "tiled"},
        inspection,
        isMaximized,
        dispatch: layoutDispatch,
        canExecute,
    } as const;
    const items = resolveToolbarItems(toolbar, toolbarContext);
    const runtime: ToolbarActionRuntime = {
        config: toolbar,
        context: toolbarContext,
        layout,
        rawPosition,
        container: globalContainerSize,
        atMaxDepth,
        setMaximized: setMaximizedWindowId,
    };
    const hasOverflow = toolbar.overflow === "auto" && hasToolbarSurfaceItems(items, runtime, "overflow");
    const hasCompactMenu = hasToolbarSurfaceItems(items, runtime, "compact");

    const windowToolbarPosition: Position = {
        top: position.top + currentMousePosition.top,
        left: position.left * scale + currentMousePosition.left,
        width: position.width - separatorThickness,
        height: windowToolbarHeight,
    };
    const dropTargetsPosition: Position = {
        top: position.top + windowToolbarHeight,
        left: position.left,
        width: position.width - separatorThickness,
        height: position.height - windowToolbarHeight - separatorThickness / 2,
    };
    const bringToFront = () => {
        if (isFloating && canExecute({type: "floating.focus", windowId}).kind === "allow") {
            layoutDispatch({type: "floating.focus", windowId});
        }
    };

    const toolbarChrome = showTabs ? (
                <div
                    id={addressKey(path)}
                    style={{
                        ...windowToolbarPosition,
                        transform: `scale(${scale})`,
                        transformOrigin: `${dragStartPosition.x}px bottom`,
                        zIndex: isMaximized ? 20 : isFloating ? (isAnyDragActive ? 999 : (floatingZIndex ?? 30)) : isAnyDragActive ? 13 : 7,
                        pointerEvents: isAnyDragActive ? "none" : "auto",
                        userSelect: isAnyDragActive ? "none" : "auto",
                    }}
                    className={`layman-toolbar ${isFloating ? "floating" : ""}`}
                    onMouseDown={bringToFront}
                    data-layman-component="toolbar"
                    data-layman-window={windowId}
                >
                    <div ref={tabContainerRef} className="tab-container" onWheel={handleTabContainerWheel}>
                        {tabs.length > 1 ? (
                            tabs.map((tab) => (
                                <Tab
                                    key={tab.id}
                                    windowId={windowId}
                                    path={path}
                                    tab={tab}
                                    isSelected={tab.id === selectedTabId}
                                    onDelete={() => layoutDispatch({type: "tab.remove", tabId: tab.id})}
                                    onMouseDown={() => layoutDispatch({type: "tab.select", tabId: tab.id})}
                                />
                            ))
                        ) : (
                            <SingleTab
                                dragRef={singleTabDrag}
                                tab={tabs[0]}
                                windowId={windowId}
                                onDelete={() => layoutDispatch({type: "tab.remove", tabId: tabs[0].id})}
                                onMouseDown={(event) => {
                                    setDragStartPosition({x: event.clientX, y: event.clientY});
                                    layoutDispatch({type: "tab.select", tabId: tabs[0].id});
                                }}
                            />
                        )}
                    </div>
                    <div ref={drag} className="drag-area" onMouseDown={(event) => setDragStartPosition({x: event.clientX, y: event.clientY})}></div>
                    <div className="toolbar-button-container">
                        <WindowToolbarWidgets items={items} runtime={runtime} surface="bar" />
                        {hasOverflow && (
                            <div className="layman-toolbar-overflow">
                                <ToolbarButton aria-label="More window controls" onClick={() => setOverflowOpen(!overflowOpen)}>
                                    <EllipsisIcon />
                                </ToolbarButton>
                                {overflowOpen && (
                                    <div className="layman-toolbar-overflow-popover">
                                        <WindowToolbarWidgets items={items} runtime={runtime} surface="overflow" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                hasCompactMenu && (
                    <WindowMenu
                        windowId={windowId}
                        position={position}
                        tabs={tabs}
                        selectedTabId={selectedTabId}
                        open={menuOpen}
                        setOpen={setMenuOpen}
                        controls={<WindowToolbarWidgets items={items} runtime={runtime} surface="compact" />}
                    />
                )
            );

    return (
        <>
            {toolbarChrome && renderToolbarFrame({window: toolbarContext.window, isMaximized, children: toolbarChrome})}
            {!isAnyDragActive && (
                <div
                    style={{
                        position: "absolute",
                        ...dropTargetsPosition,
                        zIndex: 10,
                        margin: "calc(var(--layman-separator-thickness) / 2)",
                        marginTop: 0,
                        pointerEvents: globalDragging ? "auto" : "none",
                    }}
                >
                    <WindowDropTarget windowId={windowId} path={path} position={position} placement="top" />
                    <WindowDropTarget windowId={windowId} path={path} position={position} placement="bottom" />
                    <WindowDropTarget windowId={windowId} path={path} position={position} placement="left" />
                    <WindowDropTarget windowId={windowId} path={path} position={position} placement="right" />
                    <WindowDropTarget windowId={windowId} path={path} position={position} placement="center" />
                </div>
            )}
        </>
    );
}
