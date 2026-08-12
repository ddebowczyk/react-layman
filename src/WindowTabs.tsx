import {useContext, useEffect} from "react";
import {ConnectDragSource, useDrag} from "react-dnd";
import {LaymanContext} from "./LaymanContext";
import {TabType} from "./dndTypes";
import {LaymanTab, WindowAddress} from "./types";
import {CloseIcon} from "./Icons";

interface TabProps {
    tab: LaymanTab;
    windowId: string;
    path: WindowAddress;
    isSelected: boolean;
    onMouseDown: React.MouseEventHandler<HTMLButtonElement>;
    onDelete: React.MouseEventHandler<HTMLButtonElement>;
}

export const Tab = ({tab, windowId, path, isSelected, onDelete, onMouseDown}: TabProps) => {
    const {renderTab, setGlobalDragging, mutable} = useContext(LaymanContext);
    const [{isDragging}, drag] = useDrag({
        type: TabType,
        item: {
            path,
            tab,
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    useEffect(() => {
        setGlobalDragging(isDragging);
    }, [isDragging, setGlobalDragging]);

    return (
        <div
            ref={drag}
            className={`tab ${isSelected ? "selected" : ""}`}
            style={{
                visibility: isDragging ? "hidden" : "visible",
                width: isDragging ? 0 : "auto",
            }}
        >
            <button className="tab-selector" onMouseDown={onMouseDown}>
                {renderTab(tab, windowId, isSelected)}
            </button>
            {mutable && (
                <button className="close-tab" onClick={onDelete}>
                    <CloseIcon />
                </button>
            )}
        </div>
    );
};

interface SingleTabProps {
    dragRef: ConnectDragSource;
    tab: LaymanTab;
    windowId: string;
    onDelete: React.MouseEventHandler<HTMLButtonElement>;
    onMouseDown: React.MouseEventHandler<HTMLButtonElement>;
}

export const SingleTab = ({dragRef, tab, windowId, onDelete, onMouseDown}: SingleTabProps) => {
    const {renderTab, mutable} = useContext(LaymanContext);

    return (
        <div ref={dragRef} className={`tab selected`}>
            <button className="tab-selector" onMouseDown={onMouseDown}>
                {renderTab(tab, windowId, true)}
            </button>
            {mutable && (
                <button className="close-tab" onClick={onDelete}>
                    <CloseIcon />
                </button>
            )}
        </div>
    );
};
