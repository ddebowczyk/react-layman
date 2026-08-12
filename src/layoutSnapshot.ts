import {
    FloatingWindowData,
    JsonValue,
    LaymanLayout,
    LaymanSerializedFloatingWindow,
    LaymanSerializedLayout,
    LaymanSerializedState,
    LaymanSerializedTab,
    LaymanState,
    LaymanTab,
    LaymanTree,
    Position,
} from "./types";
import {isValidFloatingPosition} from "./core/validation";

export const LAYMAN_SNAPSHOT_VERSION = 2 as const;

type UnknownRecord = Record<string, unknown>;

function fail(message: string): never {
    throw new Error(`[Layman] invalid layout snapshot: ${message}`);
}

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: UnknownRecord, allowedKeys: readonly string[], label: string): void {
    for (const key of Object.keys(value)) {
        if (!allowedKeys.includes(key)) fail(`${label} contains unknown property '${key}'`);
    }
}

function isId(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function jsonValue(value: unknown, seen = new Set<object>()): JsonValue {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
        if (Number.isFinite(value)) return value;
        return fail("tab data must not contain non-finite numbers");
    }
    if (Array.isArray(value)) {
        if (seen.has(value)) return fail("tab data must not contain cycles");
        seen.add(value);
        const result = value.map((entry) => jsonValue(entry, seen));
        seen.delete(value);
        return result;
    }
    if (isRecord(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
        if (seen.has(value)) return fail("tab data must not contain cycles");
        seen.add(value);
        const result: {[key: string]: JsonValue} = {};
        for (const [key, entry] of Object.entries(value)) result[key] = jsonValue(entry, seen);
        seen.delete(value);
        return result;
    }
    return fail("tab data must be JSON-serializable");
}

function cloneJson(value: JsonValue): JsonValue {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function serializeTab(tab: LaymanTab): LaymanSerializedTab {
    if (!isId(tab.id) || typeof tab.title !== "string") fail("tab id and title are required");
    return {id: tab.id, title: tab.title, data: cloneJson(jsonValue(tab.data))};
}

function serializeLayoutWithIds(layout: LaymanLayout): LaymanSerializedLayout {
    if (!layout) return null;
    if ("tabs" in layout) {
        return {
            kind: "window",
            id: layout.id,
            tabs: layout.tabs.map(serializeTab),
            selectedTabId: layout.selectedTabId,
            viewPercent: layout.viewPercent,
        };
    }
    return {
        kind: "node",
        id: layout.id,
        direction: layout.direction,
        viewPercent: layout.viewPercent,
        children: layout.children.map((child) => serializeLayoutWithIds(child)!),
    };
}

function serializeFloatingWindowData(window: FloatingWindowData): LaymanSerializedFloatingWindow {
    return {
        id: window.id,
        tabs: window.tabs.map(serializeTab),
        selectedTabId: window.selectedTabId,
        position: {...window.position},
        zIndex: window.zIndex,
    };
}

/** Serializes one layout tree in the current snapshot shape. */
export function serializeLayout(layout: LaymanLayout): LaymanSerializedLayout {
    const snapshot = serializeLayoutWithIds(layout);
    validateLayout(snapshot, new Set<string>(), new Set<string>(), new Set<string>(), true);
    return snapshot;
}

/** Serializes one floating window in the current snapshot shape. */
export function serializeFloatingWindow(window: FloatingWindowData): LaymanSerializedFloatingWindow {
    const snapshot = serializeFloatingWindowData(window);
    validateLaymanSnapshot({schemaVersion: LAYMAN_SNAPSHOT_VERSION, layout: null, floatingWindows: [snapshot]});
    return snapshot;
}

/** Produces the exact versioned snapshot used by persistence and host integrations. */
export function serializeState(state: LaymanState): LaymanSerializedState {
    const snapshot: LaymanSerializedState = {
        schemaVersion: LAYMAN_SNAPSHOT_VERSION,
        layout: serializeLayoutWithIds(state.layout),
        floatingWindows: state.floatingWindows.map(serializeFloatingWindowData),
    };
    validateLaymanSnapshot(snapshot);
    return snapshot;
}

function validatePosition(value: unknown, label: string): asserts value is Position {
    if (!isRecord(value)) fail(`${label} position is required`);
    rejectUnknownKeys(value, ["top", "left", "width", "height"], `${label} position`);
    const {top, left, width, height} = value;
    if (typeof top !== "number" || !Number.isFinite(top)) fail(`${label} position.top must be finite`);
    if (typeof left !== "number" || !Number.isFinite(left)) fail(`${label} position.left must be finite`);
    if (typeof width !== "number" || !Number.isFinite(width)) fail(`${label} position.width must be finite`);
    if (typeof height !== "number" || !Number.isFinite(height)) fail(`${label} position.height must be finite`);
    if (!isValidFloatingPosition({top, left, width, height})) fail(`${label} position width and height must be greater than zero`);
}

function validateTab(value: unknown, tabIds: Set<string>): asserts value is LaymanSerializedTab {
    if (!isRecord(value) || !isId(value.id) || typeof value.title !== "string") fail("tab id and title are required");
    rejectUnknownKeys(value, ["id", "title", "data"], "tab");
    if (tabIds.has(value.id)) fail(`duplicate tab id '${value.id}'`);
    tabIds.add(value.id);
    jsonValue(value.data);
}

function validateSelection(tabs: unknown[], selectedTabId: unknown): void {
    if (selectedTabId !== null && !isId(selectedTabId)) fail("selectedTabId must be a string or null");
    if (tabs.length === 0 && selectedTabId !== null) fail("an empty window must not select a tab");
    if (tabs.length > 0 && selectedTabId === null) fail("a non-empty window must select a tab");
    if (typeof selectedTabId === "string" && !tabs.some((tab) => isRecord(tab) && tab.id === selectedTabId)) {
        fail(`unknown selected tab id '${selectedTabId}'`);
    }
}

function validateLayout(
    value: unknown,
    windowIds: Set<string>,
    tabIds: Set<string>,
    splitIds: Set<string>,
    allowEmpty = false
): asserts value is LaymanSerializedLayout {
    if (value === null) {
        if (allowEmpty) return;
        fail("split children must be layout trees");
    }
    if (!isRecord(value) || (value.kind !== "window" && value.kind !== "node")) fail("layout node kind is required");
    rejectUnknownKeys(
        value,
        value.kind === "window" ? ["kind", "id", "tabs", "selectedTabId", "viewPercent"] : ["kind", "id", "direction", "children", "viewPercent"],
        `layout ${value.kind}`
    );
    if (value.viewPercent !== undefined && (typeof value.viewPercent !== "number" || !Number.isFinite(value.viewPercent))) {
        fail("viewPercent must be finite");
    }
    if (value.kind === "window") {
        if (!isId(value.id)) fail("window id is required");
        if (windowIds.has(value.id) || splitIds.has(value.id)) fail(`duplicate layout id '${value.id}'`);
        windowIds.add(value.id);
        if (!Array.isArray(value.tabs)) fail("window tabs must be an array");
        value.tabs.forEach((tab) => validateTab(tab, tabIds));
        validateSelection(value.tabs, value.selectedTabId);
        return;
    }
    if (!isId(value.id) || (value.direction !== "row" && value.direction !== "column") || !Array.isArray(value.children) || value.children.length < 2) {
        fail("split node must have direction and at least two children");
    }
    if (splitIds.has(value.id) || windowIds.has(value.id)) fail(`duplicate layout id '${value.id}'`);
    splitIds.add(value.id);
    value.children.forEach((child) => validateLayout(child, windowIds, tabIds, splitIds));
}

/** Rejects malformed snapshots before they reach the reducer or a host view. */
export function validateLaymanSnapshot(value: unknown): asserts value is LaymanSerializedState {
    if (!isRecord(value) || value.schemaVersion !== LAYMAN_SNAPSHOT_VERSION || !Array.isArray(value.floatingWindows)) {
        fail(`schemaVersion ${LAYMAN_SNAPSHOT_VERSION} and floatingWindows are required`);
    }
    rejectUnknownKeys(value, ["schemaVersion", "layout", "floatingWindows"], "snapshot");
    const windowIds = new Set<string>();
    const tabIds = new Set<string>();
    const splitIds = new Set<string>();
    validateLayout(value.layout, windowIds, tabIds, splitIds, true);
    value.floatingWindows.forEach((window, index) => {
        if (!isRecord(window) || !isId(window.id)) fail(`floating window ${index} id is required`);
        rejectUnknownKeys(window, ["id", "tabs", "selectedTabId", "position", "zIndex"], `floating window ${index}`);
        if (windowIds.has(window.id) || splitIds.has(window.id)) fail(`duplicate layout id '${window.id}'`);
        windowIds.add(window.id);
        if (!Array.isArray(window.tabs)) fail(`floating window ${index} tabs must be an array`);
        window.tabs.forEach((tab) => validateTab(tab, tabIds));
        validateSelection(window.tabs, window.selectedTabId);
        validatePosition(window.position, `floating window ${index}`);
        if (typeof window.zIndex !== "number" || !Number.isFinite(window.zIndex)) fail(`floating window ${index} zIndex must be finite`);
    });
}

function deserializeTabUnchecked(tab: LaymanSerializedTab): LaymanTab<JsonValue> {
    return {id: tab.id, title: tab.title, data: cloneJson(jsonValue(tab.data))};
}

function deserializeLayoutUnchecked(data: LaymanSerializedLayout): LaymanLayout<JsonValue> {
    if (data === null) return undefined;
    if (data.kind === "window") {
        return {
            id: data.id,
            tabs: data.tabs.map(deserializeTabUnchecked),
            selectedTabId: data.selectedTabId,
            viewPercent: data.viewPercent,
        };
    }
    return {
        id: data.id,
        direction: data.direction,
        viewPercent: data.viewPercent,
        children: data.children.map((child) => deserializeLayoutUnchecked(child)!) as unknown as [
            LaymanTree<JsonValue>,
            LaymanTree<JsonValue>,
            ...LaymanTree<JsonValue>[]
        ],
    };
}

/** Reconstructs one tab from the exact current snapshot shape. */
export function deserializeTab(tab: LaymanSerializedTab): LaymanTab<JsonValue> {
    validateTab(tab, new Set<string>());
    return deserializeTabUnchecked(tab);
}

/** Reconstructs one layout tree from the exact current snapshot shape. */
export function deserializeLayout(data: LaymanSerializedLayout): LaymanLayout<JsonValue> {
    validateLayout(data, new Set<string>(), new Set<string>(), new Set<string>(), true);
    return deserializeLayoutUnchecked(data);
}

/** Reconstructs one floating window from the exact current snapshot shape. */
export function deserializeFloatingWindow(data: LaymanSerializedFloatingWindow): FloatingWindowData<JsonValue> {
    validateLaymanSnapshot({schemaVersion: LAYMAN_SNAPSHOT_VERSION, layout: null, floatingWindows: [data]});
    return {
        id: data.id,
        tabs: data.tabs.map(deserializeTabUnchecked),
        selectedTabId: data.selectedTabId,
        position: {...data.position},
        zIndex: data.zIndex,
    };
}

/** Reconstructs reducer state from a validated, exact current-format snapshot. */
export function deserializeState(snapshot: unknown): LaymanState<JsonValue> {
    validateLaymanSnapshot(snapshot);
    return {
        layout: deserializeLayoutUnchecked(snapshot.layout),
        floatingWindows: snapshot.floatingWindows.map((window) => ({
            id: window.id,
            tabs: window.tabs.map(deserializeTabUnchecked),
            selectedTabId: window.selectedTabId,
            position: {...window.position},
            zIndex: window.zIndex,
        })),
    };
}
