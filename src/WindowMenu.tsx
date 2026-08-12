import {useContext} from "react";
import {LaymanContext} from "./LaymanContext";
import {ToolbarButton} from "./ToolbarButton";
import {AddIcon, CloseIcon, EllipsisIcon} from "./Icons";
import {createLaymanTab} from "./createLaymanTab";
import {LaymanTab, Position} from "./types";

interface WindowMenuProps {
    windowId: string;
    position: Position;
    tabs: readonly LaymanTab[];
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
export function WindowMenu({windowId, position, tabs, selectedTabId, open, setOpen, controlButtons}: WindowMenuProps) {
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
                                        layoutDispatch({type: "tab.select", tabId: tab.id});
                                        setOpen(false);
                                    }}
                                >
                                    {renderTab(tab)}
                                </button>
                                {mutable && (
                                    <button
                                        className="close-tab"
                                        onClick={() => layoutDispatch({type: "tab.remove", tabId: tab.id})}
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
                                layoutDispatch({type: "tab.insert", tab: newTab, target: {kind: "window", windowId}, placement: "center"});
                                layoutDispatch({type: "tab.select", tabId: newTab.id});
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
