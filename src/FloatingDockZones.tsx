import {useContext, type ReactElement} from "react";
import {useDragLayer, useDrop} from "react-dnd";
import type {Identifier} from "dnd-core";
import {windowDragType} from "./dnd/items";
import {LaymanContext} from "./LaymanContext";
import {findWindowRectAtPoint} from "./layoutGeometry";
import {DragData, Position} from "./types";
import {isFloatingAddress} from "./utils";
import {BottomSplitIcon, LeftSplitIcon, RightSplitIcon, TopSplitIcon, UnfloatIcon} from "./Icons";
import type {LaymanCommand, WindowTarget} from "./core/commands";

// Fixed pixel sizes for the drop-zone overlays shown while dragging a floating
// window. These are deliberately constant (not relative to container size) so
// the zones stay a comfortable, consistent drop target regardless of how large
// or small the Layman container is.
const EDGE_LONG = 200; // Length of an edge zone along the container's edge
const EDGE_SHORT = 100; // Depth of an edge zone, perpendicular to the edge
const CENTER_ZONE_MAX = 200; // Cap on the center zone's size for large windows

type Edge = "top" | "bottom" | "left" | "right";

const EDGE_ICONS: Record<Edge, () => ReactElement> = {
    top: TopSplitIcon,
    bottom: BottomSplitIcon,
    left: LeftSplitIcon,
    right: RightSplitIcon,
};

function floatingWindowMoveCommand(
    item: DragData,
    target: WindowTarget,
    placement: Edge | "center"
): LaymanCommand | undefined {
    if (!("tabs" in item) || !isFloatingAddress(item.path)) return undefined;
    return {type: "window.move", windowId: item.id, target, placement};
}

/** Computes the container-relative rect for one of the 4 fixed edge zones. */
function edgeZoneRect(edge: Edge, container: {width: number; height: number}, inset: number): Position {
    switch (edge) {
        case "top":
            return {top: inset, left: (container.width - EDGE_LONG) / 2, width: EDGE_LONG, height: EDGE_SHORT};
        case "bottom":
            return {
                top: container.height - EDGE_SHORT - inset,
                left: (container.width - EDGE_LONG) / 2,
                width: EDGE_LONG,
                height: EDGE_SHORT,
            };
        case "left":
            return {top: (container.height - EDGE_LONG) / 2, left: inset, width: EDGE_SHORT, height: EDGE_LONG};
        case "right":
            return {
                top: (container.height - EDGE_LONG) / 2,
                left: container.width - EDGE_SHORT - inset,
                width: EDGE_SHORT,
                height: EDGE_LONG,
            };
    }
}

/** One of the 4 fixed edge zones: docks the dragged floating window at the
 *  root of the layout, on that edge (splitting the root only if it isn't
 *  already a matching-direction split). */
function FloatingEdgeZone({edge, container}: {edge: Edge; container: {width: number; height: number}}) {
    const {layoutDispatch, canExecute, metrics} = useContext(LaymanContext);
    const [{isOver, handlerId}, drop] = useDrop<DragData, void, {isOver: boolean; handlerId: Identifier | null}>(() => ({
        accept: [windowDragType],
        canDrop: (item) => {
            const command = floatingWindowMoveCommand(item, {kind: "root"}, edge);
            return command !== undefined && canExecute(command).kind === "allow";
        },
        drop: (item) => {
            const command = floatingWindowMoveCommand(item, {kind: "root"}, edge);
            if (command) layoutDispatch(command);
        },
        collect: (monitor) => ({isOver: monitor.isOver(), handlerId: monitor.getHandlerId()}),
    }));
    const Icon = EDGE_ICONS[edge];
    return (
        <div
            ref={(element) => void drop(element)}
            className={`layman-floating-anchor ${edge} ${isOver ? "over" : ""}`}
            style={{position: "absolute", ...edgeZoneRect(edge, container, metrics.dockZoneInset)}}
            data-layman-component="dock-zone"
            data-layman-dock-edge={edge}
            data-layman-drop-target={handlerId ?? undefined}
        >
            <Icon />
        </div>
    );
}

/** The 5th, dynamic zone: appears centered over whichever tiled window the
 *  cursor is currently over, and merges the dragged floating window's tabs
 *  into it. */
function FloatingCenterZone({windowId, position}: {windowId: string; position: Position}) {
    const {layoutDispatch, canExecute} = useContext(LaymanContext);
    const [{isOver, handlerId}, drop] = useDrop<DragData, void, {isOver: boolean; handlerId: Identifier | null}>(
        () => ({
            accept: [windowDragType],
            canDrop: (item) => {
                const command = floatingWindowMoveCommand(item, {kind: "window", windowId}, "center");
                return command !== undefined && canExecute(command).kind === "allow";
            },
            drop: (item) => {
                const command = floatingWindowMoveCommand(item, {kind: "window", windowId}, "center");
                if (command) layoutDispatch(command);
            },
            collect: (monitor) => ({isOver: monitor.isOver(), handlerId: monitor.getHandlerId()}),
        }),
        [windowId]
    );
    const size = {
        width: Math.min(CENTER_ZONE_MAX, position.width),
        height: Math.min(CENTER_ZONE_MAX, position.height),
    };
    const rect: Position = {
        top: position.top + (position.height - size.height) / 2,
        left: position.left + (position.width - size.width) / 2,
        ...size,
    };
    return (
        <div
            ref={(element) => void drop(element)}
            className={`layman-floating-anchor center ${isOver ? "over" : ""}`}
            style={{position: "absolute", ...rect}}
            data-layman-component="dock-zone"
            data-layman-dock-edge="center"
            data-layman-drop-target={handlerId ?? undefined}
        >
            <UnfloatIcon />
        </div>
    );
}

/**
 * Renders the 5 floating-window dock zones - the 4 root edges plus the
 * dynamic "hovered tiled window" center zone - but only while a floating
 * window's whole-window drag is in progress. Detection is derived entirely
 * from the react-dnd monitor (no extra context state needed): a window drag
 * item is currently being dragged whose source address is a floating
 * window's.
 *
 * Mounted once in `Layman.tsx`, inside `.layman-root`, so positions here are
 * container-relative like every other in-root component.
 */
export function FloatingDockZones() {
    const {layout, globalContainerSize, maxDepth} = useContext(LaymanContext);

    const {isDraggingFloat, clientOffset} = useDragLayer((monitor) => {
        const itemType = monitor.getItemType();
        const item = monitor.getItem() as DragData | null;
        const isDraggingFloat =
            monitor.isDragging() && itemType === windowDragType && !!item && "tabs" in item && isFloatingAddress(item.path);
        return {
            isDraggingFloat,
            clientOffset: monitor.getClientOffset(),
        };
    });

    if (!isDraggingFloat) return null;

    const point = clientOffset
        ? {x: clientOffset.x - globalContainerSize.left, y: clientOffset.y - globalContainerSize.top}
        : null;
    const hovered = point && layout ? findWindowRectAtPoint(layout, globalContainerSize, point) : null;

    return (
        <>
            {maxDepth > 0 && (
                <>
                    <FloatingEdgeZone edge="top" container={globalContainerSize} />
                    <FloatingEdgeZone edge="bottom" container={globalContainerSize} />
                    <FloatingEdgeZone edge="left" container={globalContainerSize} />
                    <FloatingEdgeZone edge="right" container={globalContainerSize} />
                </>
            )}
            {hovered && <FloatingCenterZone windowId={hovered.windowId} position={hovered.position} />}
        </>
    );
}
