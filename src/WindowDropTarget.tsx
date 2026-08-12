import {useDrop} from "react-dnd";
import {tabDragType, windowDragType} from "./dnd/items";
import {useContext, useEffect, useRef} from "react";
import {LaymanContext} from "./LaymanContext";
import {DragData, Position, WindowAddress} from "./types";
import {isFloatingAddress} from "./utils";
import type {LaymanCommand} from "./core/commands";

interface WindowDropTargetProps {
    windowId: string;
    path: WindowAddress;
    position: Position;
    placement: "top" | "left" | "bottom" | "right" | "center";
}

function commandForDrop(
    item: DragData,
    itemType: unknown,
    windowId: string,
    placement: WindowDropTargetProps["placement"]
): LaymanCommand | undefined {
    if (itemType === tabDragType && "tab" in item) {
        return {type: "tab.move", tabId: item.tab.id, target: {kind: "window", windowId}, placement};
    }
    if (itemType === windowDragType && "tabs" in item && !isFloatingAddress(item.path)) {
        return {type: "window.move", windowId: item.id, target: {kind: "window", windowId}, placement};
    }
    return undefined;
}

export function WindowDropTarget({windowId, path, position, placement}: WindowDropTargetProps) {
    const {layoutDispatch, setDropHighlightPosition, canExecute, maxDepth, showTabs, metrics} = useContext(LaymanContext);
    const newDropHighlightPosition = useRef<Position>({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    });

    // Edge placements create a new split (depth + 1). Block them once the depth
    // limit is reached; floating destinations are always single-pane, so
    // every placement behaves like "center" there and is always allowed.
    const wouldExceedMaxDepth = placement !== "center" && !isFloatingAddress(path) && path.length >= maxDepth;

    const windowToolbarHeight = showTabs ? metrics.toolbarHeight : 0;
    const {separatorThickness} = metrics;

    useEffect(() => {
        const dropPosition: Position = {
            top: position.top + windowToolbarHeight,
            left: position.left,
            width: position.width - separatorThickness,
            height: position.height - windowToolbarHeight - separatorThickness / 2,
        };

        if (placement === "top") {
            dropPosition.height = dropPosition.height / 2;
        }
        if (placement === "bottom") {
            dropPosition.top += dropPosition.height / 2;
            dropPosition.height = dropPosition.height / 2;
        }
        if (placement === "left") {
            dropPosition.width = dropPosition.width / 2;
        }
        if (placement === "right") {
            dropPosition.left += dropPosition.width / 2;
            dropPosition.width = dropPosition.width / 2;
        }

        newDropHighlightPosition.current = dropPosition;
    }, [
        placement,
        position.height,
        position.left,
        position.top,
        position.width,
        separatorThickness,
        windowToolbarHeight,
    ]);

    const [{handlerId}, drop] = useDrop(() => ({
        accept: [tabDragType, windowDragType],
        // A floating window's whole-window drag uses the dedicated
        // FloatingDockZones instead of the ordinary per-window grid (which
        // tiles the whole canvas and would leave no free space to just
        // reposition the float). Individual tab drags, and whole-window
        // drags whose source is a tiled window, are unaffected.
        canDrop: (item: DragData, monitor) => {
            const command = commandForDrop(item, monitor.getItemType(), windowId, placement);
            return command !== undefined && canExecute(command).kind === "allow";
        },
        drop: (item: DragData, monitor) => {
            const command = commandForDrop(item, monitor.getItemType(), windowId, placement);
            if (command) layoutDispatch(command);
        },
        hover: (_item, monitor) => {
            if (!monitor.canDrop()) return;
            setDropHighlightPosition(newDropHighlightPosition.current);
        },
        collect: (monitor) => ({handlerId: monitor.getHandlerId()}),
    }));

    // Don't render a drop target for edge placements past the depth limit.
    if (wouldExceedMaxDepth) return null;

    return (
        <div
            ref={drop}
            className={`layman-window-drop-target ${placement}`}
            data-layman-component="drop-target"
            data-layman-drop-target={handlerId ?? undefined}
        ></div>
    );
}
