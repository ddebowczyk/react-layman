import "../styles/global.css";

export type {
    Children,
    LaymanDirection,
    LaymanPlacement,
    LaymanPath,
    LaymanTab,
    WindowAddress,
    FloatingWindowAddress,
    LaymanWindow,
    LaymanNode,
    LaymanLayout,
    LaymanState,
    FloatingWindowData,
    PaneRenderer,
    TabRenderer,
    LaymanContextType,
    Position,
    DragData,
    ToolBarProps,
    WindowProps,
    SeparatorProps,
    LaymanSerializedLayout,
    LaymanSerializedNode,
    LaymanSerializedTab,
    LaymanSerializedWindow,
    LaymanSerializedFloatingWindow,
    LaymanSerializedState,
    LaymanSchemaVersion,
    JsonPrimitive,
    JsonValue,
} from "./types";

export {createLaymanNode, createLaymanTab, createLaymanWindow} from "./createLaymanTab";
export type {
    LaymanChange,
    LaymanCommand,
    LaymanInspection,
    LaymanInspectedSplit,
    LaymanInspectedTab,
    LaymanInspectedWindow,
    LaymanRejectionReason,
    LaymanTransition,
    LaymanValidation,
    LaymanValidationIssue,
    WindowMoveTarget,
    WindowTarget,
} from "./core";
export {applyLaymanCommand, inspectLaymanState, validateLaymanState} from "./core";

export const TabType = "TAB";
export const WindowType = "WINDOW";

export {LaymanContext, LaymanProvider} from "./LaymanContext";
export {WindowContext, useWindowContext} from "./WindowContext";

export {Layman} from "./Layman";
export {Separator} from "./Separator";
export {Window} from "./Window";
export {ToolbarButton} from "./ToolbarButton";
export {WindowToolbar} from "./WindowToolbar";
export {Tab} from "./WindowTabs";
export {isFloatingAddress} from "./utils";
export {
    serializeLayout,
    deserializeLayout,
    deserializeTab,
    serializeFloatingWindow,
    deserializeFloatingWindow,
    serializeState,
    deserializeState,
    validateLaymanSnapshot,
    LAYMAN_SNAPSHOT_VERSION,
} from "./Serializer";
