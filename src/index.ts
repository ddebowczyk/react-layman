import "../styles/global.css";

export type {
    FloatingWindowData,
    JsonPrimitive,
    JsonValue,
    LaymanChildren as Children,
    LaymanDirection,
    LaymanLayout,
    LaymanNode,
    LaymanPlacement,
    LaymanState,
    LaymanTab,
    LaymanTree,
    LaymanWindow,
    Position,
} from "./core";
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

export {createLaymanNode, createLaymanTab, createLaymanWindow} from "./createLaymanTab";

export {createLaymanController, useLaymanController} from "./controller";
export type {
    LaymanCommandAuthorizer,
    LaymanCommandDispatcher,
    LaymanControllerDispatch,
    LaymanCommandMeta,
    LaymanCommandOrigin,
    LaymanController,
    LaymanControllerOptions,
    LaymanControllerTransition,
    LaymanTransitionListener,
    UseLaymanControllerOptions,
} from "./controller";

export type {LaymanDndConfig} from "./dnd/types";
export type {
    LaymanInteractionContext,
    LaymanInteractionDecision,
    LaymanInteractionPolicy,
    LaymanInteractionViewConfig,
} from "./controller";

export {LaymanView} from "./view";
export type {
    LaymanComponents,
    LaymanEmptyProps,
    LaymanPaneProps,
    LaymanTabProps,
    LaymanTheme,
    LaymanToolbarFrameProps,
    LaymanViewConfig,
    LaymanViewProps,
} from "./view";

export {LaymanToolbarButton} from "./toolbar/LaymanToolbarButton";
export type {
    LaymanBuiltinToolbarAction,
    LaymanBuiltinToolbarItem,
    LaymanCustomToolbarItem,
    LaymanToolbarActionResult,
    LaymanToolbarConfig,
    LaymanToolbarContext,
    LaymanToolbarItem,
    LaymanToolbarItemState,
    LaymanToolbarItemsResolver,
    LaymanToolbarLocation,
    LaymanToolbarPlacement,
    LaymanToolbarSurface,
    LaymanToolbarWidgetProps,
    LaymanToolbarWindow,
} from "./toolbar/types";

export type {
    LaymanSchemaVersion,
    LaymanSerializedFloatingWindow,
    LaymanSerializedLayout,
    LaymanSerializedNode,
    LaymanSerializedState,
    LaymanSerializedTab,
    LaymanSerializedTree,
    LaymanSerializedWindow,
} from "./types";
export {
    deserializeFloatingWindow,
    deserializeLayout,
    deserializeState,
    deserializeTab,
    LAYMAN_SNAPSHOT_VERSION,
    serializeFloatingWindow,
    serializeLayout,
    serializeState,
    validateLaymanSnapshot,
} from "./Serializer";
