import {useContext, useEffect, useRef, useState} from "react";
import {SingleTab, Tab} from "./WindowTabs";
import {ToolbarButton} from "./ToolbarButton";
import {LaymanContext} from "./LaymanContext";
import {createLaymanTab} from "./createLaymanTab";
import {WindowDropTarget} from "./WindowDropTarget";
import {WindowMenu} from "./WindowMenu";
import {Position, ToolbarButtonType, ToolBarProps} from "./types";
import {findWindowRectAtPoint} from "./layoutGeometry";
import {
    AddIcon,
    BottomSplitIcon,
    CloseIcon,
    EllipsisIcon,
    FloatIcon,
    LeftSplitIcon,
    MaximizeIcon,
    MinimizeIcon,
    RightSplitIcon,
    TopSplitIcon,
    UnfloatIcon,
} from "./Icons";
import {addressKey, deepEqual, isFloatingAddress} from "./utils";
import {useWindowDrag} from "./useWindowDrag";

function usePrevious(value: number) {
    const ref = useRef(0);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export function WindowToolbar({windowId, path, position: rawPosition, tabs, selectedTabId, zIndex: floatingZIndex}: ToolBarProps) {
    const {
        layout,
        layoutDispatch,
        globalContainerSize,
        globalDragging,
        toolbarButtons,
        maximizedPath,
        setMaximizedPath,
        maxDepth,
        showTabs,
    } = useContext(LaymanContext);
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const isFloating = isFloatingAddress(path);
    // A maximized window overrides its layout position to fill the whole container.
    const isMaximized = maximizedPath !== null && deepEqual(maximizedPath, path);
    const position = isMaximized
        ? {top: 0, left: 0, width: globalContainerSize.width, height: globalContainerSize.height}
        : rawPosition;
    // Whether to collapse the controls into an ellipsis popover instead of a full toolbar.
    const [menuOpen, setMenuOpen] = useState(false);
    // Track the previous length of the tabs array
    const previousTabCount = usePrevious(tabs.length);
    // parseInt returns NaN (not null/undefined) when the CSS variable is missing,
    // so the fallback must use || rather than ?? to actually take effect.
    const cssToolbarHeight =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue("--toolbar-height").trim(), 10) || 64;
    // When the tab row is hidden the toolbar occupies no vertical space.
    const windowToolbarHeight = showTabs ? cssToolbarHeight : 0;
    const separatorThickness =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue("--separator-thickness").trim(), 10) || 8;
    // Splits create a deeper window (path.length + 1); block them at the limit.
    // Floating windows are always single-pane, so splitting never applies.
    const atMaxDepth = isFloating || path.length >= maxDepth;
    // useEffect to handle scrolling when the number of tabs changes
    useEffect(() => {
        // Check if the number of tabs increased
        if (previousTabCount !== undefined && tabs.length > previousTabCount) {
            if (tabContainerRef.current) {
                const tabContainer = tabContainerRef.current;
                // Check if the container is scrollable
                if (tabContainer.scrollWidth > tabContainer.clientWidth) {
                    // Scroll all the way to the right (including the new tab's width)
                    tabContainer.scrollLeft = tabContainer.scrollWidth;
                }
            }
        }
    }, [tabs.length, previousTabCount]); // Run when the length of tabs changes

    // Map vertical wheel scrolling to horizontal scrolling so mouse-only users
    // can scroll through overflowing tabs (issue #12, optional).
    const handleTabContainerWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        const tabContainer = tabContainerRef.current;
        if (!tabContainer) return;
        // Only translate vertical wheel motion when the tabs actually overflow and
        // the gesture is predominantly vertical (trackpads send deltaX directly).
        if (tabContainer.scrollWidth <= tabContainer.clientWidth) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        tabContainer.scrollLeft += event.deltaY;
    };

    // Intentionally mount-only: this establishes the initially-selected tab once,
    // and must not re-fire every time `path`/`tabs`/`selectedTabId` change later
    // (e.g. from user interaction), or it would override the user's own selection.
    useEffect(() => {
        const selectedTab = tabs.find((tab) => tab.id === selectedTabId);
        if (selectedTab) layoutDispatch({type: "tab.select", tabId: selectedTab.id});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const {
        currentMousePosition,
        drag,
        dragStartPosition,
        isDragging,
        isSingleTabDragging: singleTabIsDragging,
        setDragStartPosition,
        singleTabDrag,
    } = useWindowDrag({windowId, path, position, tabs, selectedTabId});

    // Floating windows aren't part of the split tree, so a whole-window drag
    // moves the real window 1:1 instead of showing a shrunken "ghost" preview.
    const scale = (isDragging || singleTabIsDragging) && !isFloating ? 0.7 : 1;

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

    // Move this window out of the layout into a brand-new floating window,
    // keeping its current calculated size/position. Expressed as a single
    // `window.move` command so the same tabs and selection move by reference -
    // nothing is destroyed and recreated, so pane state survives.
    const floatWindow = () => {
        if (isMaximized) setMaximizedPath(null);
        layoutDispatch({
            type: "window.move",
            windowId,
            target: {
                kind: "floating",
                position: {
                    top: rawPosition.top,
                    left: rawPosition.left,
                    width: rawPosition.width,
                    height: rawPosition.height,
                },
            },
            placement: "center",
        });
    };

    // Dock this floating window back into the tree, under whichever tiled
    // window is currently under its center point (or drag it onto a
    // `WindowDropTarget` for the same effect with a precise destination).
    const unfloatWindow = () => {
        if (!isFloatingAddress(path)) return;
        const center = {x: position.left + position.width / 2, y: position.top + position.height / 2};
        const target = layout ? findWindowRectAtPoint(layout, globalContainerSize, center) : null;

        // Fallback: if the center is over nothing but the layout is empty,
        // seed a brand new root window. Otherwise, do nothing (stay floating).
        if (target === null) {
            if (!layout) {
                layoutDispatch({type: "window.move", windowId, target: {kind: "root"}, placement: "center"});
            } else {
                return;
            }
            return;
        }

        layoutDispatch({
            type: "window.move",
            windowId,
            target: {kind: "window", windowId: target.windowId},
            placement: "center",
        });
    };

    // Bring this floating window to the front on any interaction with it.
    const bringToFront = () => {
        if (isFloatingAddress(path)) layoutDispatch({type: "floating.focus", windowId});
    };

    // The four split buttons only differ by which edge they split towards and
    // which icon they show, so their button-creation logic is shared here
    // instead of being duplicated per direction.
    const SPLIT_BUTTON_CONFIG = {
        splitTop: {placement: "top", Icon: TopSplitIcon},
        splitBottom: {placement: "bottom", Icon: BottomSplitIcon},
        splitLeft: {placement: "left", Icon: LeftSplitIcon},
        splitRight: {placement: "right", Icon: RightSplitIcon},
    } as const;

    const createToolbarButton = (child: ToolbarButtonType, index: number) => {
        // Hide split buttons once the maximum nesting depth is reached.
        if (atMaxDepth && child in SPLIT_BUTTON_CONFIG) {
            return null;
        }
        if (child in SPLIT_BUTTON_CONFIG) {
            const {placement, Icon} = SPLIT_BUTTON_CONFIG[child as keyof typeof SPLIT_BUTTON_CONFIG];
            return (
                <ToolbarButton
                    key={index}
                    onClick={() =>
                        layoutDispatch({
                            type: "tab.insert",
                            tab: createLaymanTab("blank", {}),
                            target: {kind: "window", windowId},
                            placement,
                        })
                    }
                >
                    <Icon />
                </ToolbarButton>
            );
        }
        switch (child) {
            // "maximize" is a toggle: it becomes "minimize" while this window is
            // maximized. "minimize" behaves identically so either type works.
            case "maximize":
            case "minimize":
                return (
                    <ToolbarButton key={index} onClick={() => setMaximizedPath(isMaximized ? null : path)}>
                        {isMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
                    </ToolbarButton>
                );
            // "float" is a toggle: it becomes "unfloat" while this window is
            // already floating. "unfloat" behaves identically so either type works.
            case "float":
            case "unfloat":
                return (
                    <ToolbarButton key={index} onClick={() => (isFloating ? unfloatWindow() : floatWindow())}>
                        {isFloating ? <UnfloatIcon /> : <FloatIcon />}
                    </ToolbarButton>
                );
            case "close":
                return (
                    <ToolbarButton
                        key={index}
                        onClick={() => {
                            layoutDispatch({
                                type: "window.close",
                                windowId,
                            });
                        }}
                    >
                        <CloseIcon />
                    </ToolbarButton>
                );
            case "misc":
                return (
                    <ToolbarButton key={index} onClick={() => {}}>
                        <EllipsisIcon />
                    </ToolbarButton>
                );
        }
    };

    // The window control buttons (shared by the toolbar and the ellipsis menu).
    const controlButtons = toolbarButtons?.map((child, index) => createToolbarButton(child, index)) ?? [];
    // Always append the "misc" button at the end, but only when the tab row is shown.
    if (showTabs) {
        controlButtons.push(createToolbarButton("misc", controlButtons.length));
    }

    return (
        <>
            {showTabs ? (
                <div
                    id={addressKey(path)}
                    style={{
                        ...windowToolbarPosition,
                        transform: `scale(${scale})`,
                        transformOrigin: `${dragStartPosition.x}px bottom`,
                        zIndex: isMaximized
                            ? 20
                            : isFloating
                              ? isDragging || singleTabIsDragging
                                  ? 999
                                  : (floatingZIndex ?? 30)
                              : isDragging || singleTabIsDragging
                                ? 13
                                : 7,
                        pointerEvents: isDragging || singleTabIsDragging ? "none" : "auto",
                        userSelect: isDragging || singleTabIsDragging ? "none" : "auto",
                    }}
                    className={`layman-toolbar ${isFloating ? "floating" : ""}`}
                    onMouseDown={bringToFront}
                >
                    {/** Render each tab */}
                    <div ref={tabContainerRef} className="tab-container" onWheel={handleTabContainerWheel}>
                        {tabs.length > 1 ? (
                            tabs.map((tab) => {
                                return (
                                    <Tab
                                        key={tab.id}
                                        windowId={windowId}
                                        path={path}
                                        tab={tab}
                                        isSelected={tab.id === selectedTabId}
                                        onDelete={() =>
                                            layoutDispatch({
                                                type: "tab.remove",
                                                tabId: tab.id,
                                            })
                                        }
                                        onMouseDown={() =>
                                            layoutDispatch({
                                                type: "tab.select",
                                                tabId: tab.id,
                                            })
                                        }
                                    />
                                );
                            })
                        ) : (
                            <SingleTab
                                dragRef={singleTabDrag}
                                tab={tabs[0]}
                                windowId={windowId}
                                onDelete={() =>
                                    layoutDispatch({
                                        type: "tab.remove",
                                        tabId: tabs[0].id,
                                    })
                                }
                                onMouseDown={(event) => {
                                    setDragStartPosition({
                                        x: event.clientX,
                                        y: event.clientY,
                                    });
                                    layoutDispatch({
                                        type: "tab.select",
                                        tabId: tabs[0].id,
                                    });
                                }}
                            />
                        )}
                    </div>
                    {/** Button to add a new blank tab */}
                    <div style={{display: "flex"}}>
                        <ToolbarButton
                            onClick={() => {
                                const newTab = createLaymanTab("blank", {});
                                layoutDispatch({
                                    type: "tab.insert",
                                    tab: newTab,
                                    target: {kind: "window", windowId},
                                    placement: "center",
                                });
                                layoutDispatch({
                                    type: "tab.select",
                                    tabId: newTab.id,
                                });
                            }}
                        >
                            <AddIcon />
                        </ToolbarButton>
                    </div>
                    {/** Draggable area to move window */}
                    <div
                        ref={drag}
                        className="drag-area"
                        onMouseDown={(event) => {
                            setDragStartPosition({
                                x: event.clientX,
                                y: event.clientY,
                            });
                        }}
                    ></div>
                    {/** Buttons to convert window to a row or column */}
                    <div className="toolbar-button-container">{controlButtons}</div>
                </div>
            ) : (
                <WindowMenu
                    windowId={windowId}
                    position={position}
                    tabs={tabs}
                    selectedTabId={selectedTabId}
                    open={menuOpen}
                    setOpen={setMenuOpen}
                    controlButtons={controlButtons}
                />
            )}
            {!(isDragging || singleTabIsDragging) && (
                <div
                    style={{
                        position: "absolute",
                        ...dropTargetsPosition,
                        zIndex: 10,
                        margin: "calc(var(--separator-thickness, 8px) / 2)",
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
