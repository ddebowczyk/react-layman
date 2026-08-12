import {useContext, useEffect, useState} from "react";
import {LaymanContext} from "./LaymanContext";
import {useDragLayer} from "react-dnd";
import {createPortal} from "react-dom";
import {Position, WindowProps} from "./types";
import {isFloatingAddress} from "./utils";

export function Window({windowId, position: rawPosition, path, tab, isSelected, zIndex: floatingZIndex}: WindowProps) {
    const {
        globalContainerSize,
        metrics,
        renderPane,
        draggedWindowTabs,
        windowDragStartPosition,
        maximizedWindowId,
        showTabs,
        layoutDispatch,
        canExecute,
        viewId,
    } = useContext(LaymanContext);

    const isFloating = isFloatingAddress(path);

    // When the tab row is hidden the toolbar takes no vertical space, so the pane
    // fills the entire window region.
    const windowToolbarHeight = showTabs ? metrics.toolbarHeight : 0;
    const {separatorThickness} = metrics;

    // A maximized window overrides its layout position to fill the whole container.
    const isMaximized = maximizedWindowId === windowId;
    const position: Position = isMaximized
        ? {top: 0, left: 0, width: globalContainerSize.width, height: globalContainerSize.height}
        : rawPosition;
    const isDragging = draggedWindowTabs.includes(tab);
    // Floating windows aren't part of the split tree, so a whole-window drag
    // moves the real window instead of showing a shrunken "ghost" preview.
    const scale = isDragging && !isFloating ? 0.7 : 1;

    // Bring this floating window to the front when its content is interacted with.
    const bringToFront = () => {
        if (isFloating && canExecute({type: "floating.focus", windowId}).kind === "allow") {
            layoutDispatch({type: "floating.focus", windowId});
        }
    };

    // Custom drag layer to track mouse position during dragging
    const {clientOffset} = useDragLayer((monitor) => ({
        clientOffset: monitor.getClientOffset(),
    }));

    // State to keep track of the current mouse position (top, left) during dragging
    const [currentMousePosition, setCurrentMousePosition] = useState({
        top: position.top,
        left: position.left,
    });

    // Effect to handle dragging logic and update the current mouse position during dragging
    useEffect(() => {
        if (isDragging && clientOffset) {
            const deltaX = windowDragStartPosition.x;
            const deltaY = windowDragStartPosition.y;
            setCurrentMousePosition({
                top: clientOffset.y - deltaY,
                left: clientOffset.x - deltaX,
            });
        } else {
            setCurrentMousePosition({
                top: 0,
                left: 0,
            });
        }
    }, [clientOffset, isDragging, windowDragStartPosition.x, windowDragStartPosition.y]);

    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

    // Check for the portal target element when the component mounts
    useEffect(() => {
        const element = document.getElementById(`${viewId}-drag-window-border`);
        if (element) {
            setPortalElement(element);
        } else {
            console.error("Element with id 'drag-window-border' not found.");
        }
    }, [viewId]);

    if (!portalElement) {
        return null; // Don't render until portal element is available
    }

    const adjustedWindowPosition: Position = {
        top: position.top + windowToolbarHeight + separatorThickness / 2 + currentMousePosition.top,
        left: position.left * scale + currentMousePosition.left,
        width: position.width - separatorThickness,
        height: position.height - windowToolbarHeight - separatorThickness,
    };

    const borderPosition: Position = {
        top: position.top + (windowToolbarHeight / 2) * scale + currentMousePosition.top + globalContainerSize.top,
        left: position.left * scale + currentMousePosition.left + globalContainerSize.left,
        width: position.width - separatorThickness + 2, // +2 for thickness of the border itself
        height: position.height - separatorThickness / 2,
    };

    const zIndex = isMaximized
        ? 20
        : isFloating
          ? isDragging
              ? 999
              : (floatingZIndex ?? 30)
          : isDragging
            ? 12
            : 5;

    return (
        <div
            id={tab.id}
            style={{
                ...adjustedWindowPosition,
                transform: `scale(${scale})`,
                transformOrigin: `${windowDragStartPosition.x}px top`,
                zIndex,
                pointerEvents: isDragging ? "none" : "auto",
            }}
            className={`layman-window ${isSelected ? "selected" : "unselected"} ${isFloating ? "floating" : ""}`}
            onMouseDown={bringToFront}
            data-layman-component="window"
            data-layman-window={windowId}
            data-layman-tab={tab.id}
        >
            {isDragging &&
                !isFloating &&
                createPortal(
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 12,
                            ...borderPosition,
                            transform: `scale(${scale})`,
                            transformOrigin: `${windowDragStartPosition.x}px top`,
                            border: "var(--layman-indicator-thickness) solid var(--layman-accent-color)",
                            borderRadius: "var(--layman-border-radius)",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    ></div>,
                    document.getElementById(`${viewId}-drag-window-border`)!
                )}
            {renderPane(tab, windowId, isSelected)}
        </div>
    );
}
