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
    const {canExecute, layoutDispatch, renderTab, metrics} = useContext(LaymanContext);

    const {toolbarHeight: cssToolbarHeight, separatorThickness} = metrics;

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
            data-layman-component="window-menu"
            data-layman-window={windowId}
        >
            <ToolbarButton
                className="toolbar-button layman-window-menu-trigger"
                aria-label={open ? "Close window controls" : "Open window controls"}
                aria-expanded={open}
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
                                    type="button"
                                    className="tab-selector"
                                    disabled={canExecute({type: "tab.select", tabId: tab.id}).kind === "deny"}
                                    onClick={() => {
                                        layoutDispatch({type: "tab.select", tabId: tab.id});
                                        setOpen(false);
                                    }}
                                >
                                    {renderTab(tab, windowId, tab.id === selectedTabId)}
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Close ${tab.title}`}
                                    className="close-tab"
                                    disabled={canExecute({type: "tab.remove", tabId: tab.id}).kind === "deny"}
                                    onClick={() => layoutDispatch({type: "tab.remove", tabId: tab.id})}
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="layman-window-menu-controls">{controls}</div>
                </div>
            )}
        </div>
    );
}
