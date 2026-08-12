import {useContext, useEffect, useState} from "react";
import {useDrag, useDragLayer} from "react-dnd";
import {windowDragType} from "./dnd/items";
import {LaymanContext} from "./LaymanContext";
import type {LaymanTab, Position, WindowAddress} from "./types";
import {isFloatingAddress} from "./utils";

interface UseWindowDragOptions {
    windowId: string;
    path: WindowAddress;
    position: Position;
    tabs: readonly LaymanTab[];
    selectedTabId: string | null;
}

/** Coordinates the two drag handles that can move one window. */
export function useWindowDrag({windowId, path, position, tabs, selectedTabId}: UseWindowDragOptions) {
    const {canExecute, layoutDispatch, setGlobalDragging, setWindowDragStartPosition, setDraggedWindowTabs} = useContext(LaymanContext);
    const [currentMousePosition, setCurrentMousePosition] = useState({top: 0, left: 0});
    const [dragStartPosition, setDragStartPosition] = useState({x: 0, y: 0});
    const finishDrag = (monitor: {didDrop: () => boolean}) => {
        if (isFloatingAddress(path) && !monitor.didDrop()) {
            layoutDispatch({
                type: "floating.position",
                windowId,
                position: {
                    top: position.top + currentMousePosition.top,
                    left: position.left + currentMousePosition.left,
                    width: position.width,
                    height: position.height,
                },
            });
        }
        setDraggedWindowTabs([]);
        setWindowDragStartPosition({x: 0, y: 0});
    };

    const dragSpec = {
        type: windowDragType,
        item: {id: windowId, path, tabs, selectedTabId},
        canDrag: () => {
            const command = isFloatingAddress(path)
                ? {type: "floating.position" as const, windowId, position}
                : {type: "window.move" as const, windowId, target: {kind: "root" as const}, placement: "center" as const};
            return canExecute(command).kind === "allow";
        },
        collect: (monitor: {isDragging: () => boolean}) => ({isDragging: monitor.isDragging()}),
        end: (_item: unknown, monitor: {didDrop: () => boolean}) => finishDrag(monitor),
    };
    const [{isDragging}, drag, dragPreview] = useDrag(dragSpec);
    const [{isDragging: isSingleTabDragging}, singleTabDrag, singleTabDragPreview] = useDrag(dragSpec);

    useEffect(() => {
        // `Image` does not exist while React renders on the server. Drag
        // previews only apply in the browser, after this view has mounted.
        if (typeof Image === "undefined") return;

        const image = new Image();
        image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        dragPreview(image);
        singleTabDragPreview(image);
    }, [dragPreview, singleTabDragPreview]);

    const {clientOffset} = useDragLayer((monitor) => ({clientOffset: monitor.getClientOffset()}));
    useEffect(() => {
        if (clientOffset && (isDragging || isSingleTabDragging)) {
            setCurrentMousePosition({top: clientOffset.y - dragStartPosition.y, left: clientOffset.x - dragStartPosition.x});
        } else {
            setCurrentMousePosition({top: 0, left: 0});
        }
    }, [clientOffset, dragStartPosition.x, dragStartPosition.y, isDragging, isSingleTabDragging]);

    useEffect(() => {
        setGlobalDragging(isDragging || isSingleTabDragging);
    }, [isDragging, isSingleTabDragging, setGlobalDragging]);

    useEffect(() => {
        if (isDragging || isSingleTabDragging) {
            setDraggedWindowTabs(tabs);
            setWindowDragStartPosition(dragStartPosition);
        }
    }, [dragStartPosition, isDragging, isSingleTabDragging, setDraggedWindowTabs, setWindowDragStartPosition, tabs]);

    return {currentMousePosition, drag, dragStartPosition, isDragging, isSingleTabDragging, setDragStartPosition, singleTabDrag};
}
