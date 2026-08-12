import {AddIcon, BottomSplitIcon, CloseIcon, FloatIcon, LeftSplitIcon, MaximizeIcon, MinimizeIcon, RightSplitIcon, TopSplitIcon, UnfloatIcon} from "../Icons";
import {ToolbarButton} from "../ToolbarButton";
import type {JsonValue} from "../core/model";
import type {LaymanBuiltinToolbarAction, LaymanToolbarWidgetProps} from "./types";

function toolbarIcon(action: LaymanBuiltinToolbarAction, active: boolean) {
    switch (action) {
        case "tab.create":
            return <AddIcon />;
        case "window.split.top":
            return <TopSplitIcon />;
        case "window.split.bottom":
            return <BottomSplitIcon />;
        case "window.split.left":
            return <LeftSplitIcon />;
        case "window.split.right":
            return <RightSplitIcon />;
        case "window.maximize":
            return active ? <MinimizeIcon /> : <MaximizeIcon />;
        case "window.float":
            return active ? <UnfloatIcon /> : <FloatIcon />;
        case "window.close":
            return <CloseIcon />;
    }
}

/** The optional default visual for a declarative built-in toolbar action. */
export function LaymanToolbarButton<TData extends JsonValue>({item, state, invoke}: LaymanToolbarWidgetProps<TData>) {
    if (item.kind !== "builtin") return null;
    return (
        <ToolbarButton
            aria-label={state.label}
            data-layman-toolbar-item={item.id}
            disabled={state.disabled}
            onClick={invoke}
            title={state.disabledReason ?? state.label}
        >
            {toolbarIcon(item.action, Boolean(state.active))}
        </ToolbarButton>
    );
}
