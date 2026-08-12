import {useContext, useEffect} from "react";
import {ConnectDragSource, useDrag} from "react-dnd";
import {LaymanContext} from "./LaymanContext";
import {tabDragType} from "./dnd/items";
import {LaymanTab, WindowAddress} from "./types";
import {CloseIcon} from "./Icons";

interface TabProps {
    tab: LaymanTab;
    windowId: string;
    path: WindowAddress;
    isSelected: boolean;
    onSelect: React.MouseEventHandler<HTMLButtonElement>;
    onDelete: React.MouseEventHandler<HTMLButtonElement>;
}

export const Tab = ({tab, windowId, path, isSelected, onDelete, onSelect}: TabProps) => {
    const {canExecute, renderTab, setGlobalDragging} = useContext(LaymanContext);
    const selectDecision = canExecute({type: "tab.select", tabId: tab.id});
    const removeDecision = canExecute({type: "tab.remove", tabId: tab.id});
    const moveDecision = canExecute({
        type: "tab.move",
        tabId: tab.id,
        target: {kind: "window", windowId},
        placement: "center",
    });
    const [{isDragging}, drag] = useDrag({
        type: tabDragType,
        item: {
            path,
            tab,
        },
        canDrag: moveDecision.kind === "allow",
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    useEffect(() => {
        setGlobalDragging(isDragging);
    }, [isDragging, setGlobalDragging]);

    return (
        <div
            ref={(element) => void drag(element)}
            className={`tab ${isSelected ? "selected" : ""}`}
            style={{
                visibility: isDragging ? "hidden" : "visible",
                width: isDragging ? 0 : "auto",
            }}
            data-layman-component="tab"
            data-layman-tab={tab.id}
            data-layman-window={windowId}
        >
            <button className="tab-selector" type="button" disabled={selectDecision.kind === "deny"} onClick={onSelect}>
                {renderTab(tab, windowId, isSelected)}
            </button>
            <button type="button" aria-label={`Close ${tab.title}`} className="close-tab" disabled={removeDecision.kind === "deny"} onClick={onDelete}>
                <CloseIcon />
            </button>
        </div>
    );
};

interface SingleTabProps {
    dragRef: ConnectDragSource;
    tab: LaymanTab;
    windowId: string;
    onDelete: React.MouseEventHandler<HTMLButtonElement>;
    onSelect: React.MouseEventHandler<HTMLButtonElement>;
    onMouseDown: React.MouseEventHandler<HTMLButtonElement>;
}

export const SingleTab = ({dragRef, tab, windowId, onDelete, onMouseDown, onSelect}: SingleTabProps) => {
    const {canExecute, renderTab} = useContext(LaymanContext);
    const selectDecision = canExecute({type: "tab.select", tabId: tab.id});
    const removeDecision = canExecute({type: "tab.remove", tabId: tab.id});

    return (
        <div
            ref={(element) => void dragRef(element)}
            className="tab selected"
            data-layman-component="tab"
            data-layman-tab={tab.id}
            data-layman-window={windowId}
        >
            <button className="tab-selector" type="button" disabled={selectDecision.kind === "deny"} onMouseDown={onMouseDown} onClick={onSelect}>
                {renderTab(tab, windowId, true)}
            </button>
            <button type="button" aria-label={`Close ${tab.title}`} className="close-tab" disabled={removeDecision.kind === "deny"} onClick={onDelete}>
                <CloseIcon />
            </button>
        </div>
    );
};
