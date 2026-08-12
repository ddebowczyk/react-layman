import {useContext} from "react";
import {LaymanContext} from "./LaymanContext";
import {ToolbarButton} from "./ToolbarButton";
import {CloseIcon, EllipsisIcon} from "./Icons";
import {LaymanTab, Position} from "./types";

interface WindowMenuProps {
    windowId: string;
    position: Position;
    tabs: readonly LaymanTab[];
    selectedTabId: string | null;
    open: boolean;
    setOpen: (open: boolean) => void;
    controls: React.ReactNode;
}

/**
 * Compact window controls used when `showTabs` is false. Renders a single
 * square ellipsis button in the window's top-right corner. The supplied
 * toolbar configuration defines the entire control set in its popover.
 */
export function WindowMenu({windowId, position, tabs, selectedTabId, open, setOpen, controls}: WindowMenuProps) {
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
                                    {renderTab(tab, windowId, tab.id === selectedTabId)}
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
                    <div className="layman-window-menu-controls">{controls}</div>
                </div>
            )}
        </div>
    );
}
