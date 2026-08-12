import type {JsonValue, LaymanState, LaymanTree, Position} from "./model";

export type LaymanValidationIssue =
    | "duplicate-tab-id"
    | "duplicate-layout-id"
    | "duplicate-window-id"
    | "duplicate-split-id"
    | "empty-id"
    | "invalid-selection"
    | "invalid-position"
    | "invalid-z-index"
    | "invalid-view-percent"
    | "invalid-tab-data";

export interface LaymanValidation {
    valid: boolean;
    issues: readonly LaymanValidationIssue[];
}

export function isJsonValue(value: unknown, seen = new Set<object>()): value is JsonValue {
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (!value || typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const valid = Array.isArray(value)
        ? value.every((entry) => isJsonValue(entry, seen))
        : (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) &&
          Object.values(value).every((entry) => isJsonValue(entry, seen));
    seen.delete(value);
    return valid;
}

function isId(value: string): boolean {
    return value.trim().length > 0;
}

/** A floating panel needs finite coordinates and a positive visible area. */
export function isValidFloatingPosition(value: Position): boolean {
    return [value.top, value.left, value.width, value.height].every(Number.isFinite) && value.width > 0 && value.height > 0;
}

/** Validates the complete state graph without changing it. */
export function validateLaymanState<TData extends JsonValue>(state: LaymanState<TData>): LaymanValidation {
    const issues = new Set<LaymanValidationIssue>();
    const tabIds = new Set<string>();
    const windowIds = new Set<string>();
    const splitIds = new Set<string>();
    const layoutIds = new Set<string>();

    const visitTree = (tree: LaymanTree<TData>) => {
        if ("tabs" in tree) {
            if (!isId(tree.id)) issues.add("empty-id");
            if (windowIds.has(tree.id)) issues.add("duplicate-window-id");
            if (layoutIds.has(tree.id)) issues.add("duplicate-layout-id");
            windowIds.add(tree.id);
            layoutIds.add(tree.id);
            const localIds = new Set<string>();
            for (const tab of tree.tabs) {
                if (!isId(tab.id)) issues.add("empty-id");
                if (tabIds.has(tab.id)) issues.add("duplicate-tab-id");
                tabIds.add(tab.id);
                if (localIds.has(tab.id)) issues.add("duplicate-tab-id");
                localIds.add(tab.id);
                if (!isJsonValue(tab.data)) issues.add("invalid-tab-data");
            }
            if ((tree.tabs.length === 0 && tree.selectedTabId !== null) || (tree.tabs.length > 0 && !localIds.has(tree.selectedTabId ?? ""))) {
                issues.add("invalid-selection");
            }
            if (tree.viewPercent !== undefined && !Number.isFinite(tree.viewPercent)) issues.add("invalid-view-percent");
            return;
        }
        if (!isId(tree.id)) issues.add("empty-id");
        if (splitIds.has(tree.id)) issues.add("duplicate-split-id");
        if (layoutIds.has(tree.id)) issues.add("duplicate-layout-id");
        splitIds.add(tree.id);
        layoutIds.add(tree.id);
        if (tree.viewPercent !== undefined && !Number.isFinite(tree.viewPercent)) issues.add("invalid-view-percent");
        tree.children.forEach(visitTree);
    };

    if (state.layout) visitTree(state.layout);
    for (const window of state.floatingWindows) {
        if (!isId(window.id)) issues.add("empty-id");
        if (windowIds.has(window.id)) issues.add("duplicate-window-id");
        if (layoutIds.has(window.id)) issues.add("duplicate-layout-id");
        windowIds.add(window.id);
        layoutIds.add(window.id);
        const localIds = new Set<string>();
        for (const tab of window.tabs) {
            if (!isId(tab.id)) issues.add("empty-id");
            if (tabIds.has(tab.id)) issues.add("duplicate-tab-id");
            tabIds.add(tab.id);
            if (localIds.has(tab.id)) issues.add("duplicate-tab-id");
            localIds.add(tab.id);
            if (!isJsonValue(tab.data)) issues.add("invalid-tab-data");
        }
        if ((window.tabs.length === 0 && window.selectedTabId !== null) || (window.tabs.length > 0 && !localIds.has(window.selectedTabId ?? ""))) {
            issues.add("invalid-selection");
        }
        if (!isValidFloatingPosition(window.position)) issues.add("invalid-position");
        if (!Number.isFinite(window.zIndex)) issues.add("invalid-z-index");
    }
    return {valid: issues.size === 0, issues: [...issues]};
}
