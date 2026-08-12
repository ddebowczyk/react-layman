import { FloatingWindowData, JsonValue, LaymanLayout, LaymanSerializedFloatingWindow, LaymanSerializedLayout, LaymanSerializedState, LaymanSerializedTab, LaymanState, LaymanTab } from './types';
export declare const LAYMAN_SNAPSHOT_VERSION: 2;
/** Serializes one layout tree in the current snapshot shape. */
export declare function serializeLayout(layout: LaymanLayout): LaymanSerializedLayout;
/** Serializes one floating window in the current snapshot shape. */
export declare function serializeFloatingWindow(window: FloatingWindowData): LaymanSerializedFloatingWindow;
/** Produces the exact versioned snapshot used by persistence and host integrations. */
export declare function serializeState(state: LaymanState): LaymanSerializedState;
/** Rejects malformed snapshots before they reach the reducer or a host view. */
export declare function validateLaymanSnapshot(value: unknown): asserts value is LaymanSerializedState;
/** Reconstructs one tab from the exact current snapshot shape. */
export declare function deserializeTab(tab: LaymanSerializedTab): LaymanTab<JsonValue>;
/** Reconstructs one layout tree from the exact current snapshot shape. */
export declare function deserializeLayout(data: LaymanSerializedLayout): LaymanLayout<JsonValue>;
/** Reconstructs one floating window from the exact current snapshot shape. */
export declare function deserializeFloatingWindow(data: LaymanSerializedFloatingWindow): FloatingWindowData<JsonValue>;
/** Reconstructs reducer state from a validated, exact current-format snapshot. */
export declare function deserializeState(snapshot: unknown): LaymanState<JsonValue>;
