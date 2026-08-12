import {useContext} from "react";
import {LaymanContext} from "./LaymanContext";
import {ToolbarButton} from "./ToolbarButton";
import {AddIcon, CloseIcon, EllipsisIcon} from "./Icons";
import {createLaymanTab} from "./createLaymanTab";
import {LaymanTab, Position, WindowAddress} from "./types";

interface WindowMenuProps {
    path: WindowAddress;
    position: Position;
    tabs: LaymanTab[];
    selectedTabId: string | null;
    open: boolean;
    setOpen: (open: boolean) => void;
    // Pre-rendered window control buttons (maximize/float/close/etc.).
    controlButtons: React.ReactNode;
}

/**
 * Compact window controls used when `showTabs` is false. Renders a single
 * square ellipsis button in the window's top-right corner; clicking it opens a
 * popover that exposes tab selection, adding tabs, and the window control
 * buttons that would otherwise live in the toolbar.
 */
export function WindowMenu({path, position, tabs, selectedTabId, open, setOpen, controlButtons}: WindowMenuProps) {
    const {layoutDispatch, renderTab, mutable} = useContext(LaymanContext);

    // parseInt returns NaN (not null/undefined) when the CSS variable is missing,
    // so the fallback must use || rather than ?? to actually take effect.
    const cssToolbarHeight =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue("--toolbar-height").trim(), 10) || 64;
    const separatorThickness =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue("--separator-thickness").trim(), 10) || 8;

    const buttonSize = cssToolbarHeight;

    return (
        <div
            className="layman-window-menu"
            style={{
                position: "absolute",
                top: position.top + separatorThickness,
                left: position.left + position.width - buttonSize - separatorThickness,
                zIndex: 8,
            }}
        >
            <ToolbarButton
                className="toolbar-button layman-window-menu-trigger"
                onClick={() => setOpen(!open)}
                style={{width: buttonSize, height: buttonSize}}
            >
                <EllipsisIcon />
            </ToolbarButton>
            {open && (
                <div className="layman-window-menu-popover">
                    <div className="layman-window-menu-tabs">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`layman-window-menu-tab ${tab.id === selectedTabId ? "selected" : ""}`}
                            >
                                <button
                                    className="tab-selector"
                                    onMouseDown={() => {
                                        layoutDispatch({type: "selectTab", path, tab});
                                        setOpen(false);
                                    }}
                                >
                                    {renderTab(tab)}
                                </button>
                                {mutable && (
                                    <button
                                        className="close-tab"
                                        onClick={() => layoutDispatch({type: "removeTab", path, tab})}
                                    >
                                        <CloseIcon />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="layman-window-menu-controls">
                        <ToolbarButton
                            onClick={() => {
                                const newTab = createLaymanTab("blank", {});
                                layoutDispatch({type: "addTab", path, tab: newTab});
                                layoutDispatch({type: "selectTab", path, tab: newTab});
                            }}
                        >
                            <AddIcon />
                        </ToolbarButton>
                        {controlButtons}
                    </div>
                </div>
            )}
        </div>
    );
}
