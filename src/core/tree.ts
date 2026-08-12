import type {JsonValue, LaymanChildren, LaymanDirection, LaymanLayout, LaymanNode, LaymanPlacement, LaymanTree, LaymanWindow} from "./model";
import type {TreePath} from "./indexing";

function cloneTreeWithPercent<TData extends JsonValue>(tree: LaymanTree<TData>, viewPercent: number | undefined): LaymanTree<TData> {
    return {...tree, viewPercent};
}

function toChildren<T>(items: readonly T[]): LaymanChildren<T> {
    if (items.length < 2) throw new Error("[Layman] internal tree error: split must have at least two children");
    return items as unknown as LaymanChildren<T>;
}

function derivedId(prefix: string, stateIds: Set<string>, parts: readonly string[]): string {
    const base = `${prefix}-${parts.map(encodeURIComponent).join("-")}`;
    let candidate = base;
    let suffix = 2;
    while (stateIds.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}

export function createWindowId<TData extends JsonValue>(layout: LaymanLayout<TData>, tabId: string, requestedId?: string): string {
    const {windowIds, splitIds} = collectIds(layout);
    const ids = new Set([...windowIds, ...splitIds]);
    if (requestedId && !ids.has(requestedId)) return requestedId;
    return derivedId("window", ids, [tabId]);
}

function createSplitId<TData extends JsonValue>(layout: LaymanLayout<TData>, firstId: string, secondId: string): string {
    const {windowIds, splitIds} = collectIds(layout);
    return derivedId("split", new Set([...windowIds, ...splitIds]), [firstId, secondId]);
}

export function collectIds<TData extends JsonValue>(layout: LaymanLayout<TData>): {windowIds: Set<string>; splitIds: Set<string>} {
    const windowIds = new Set<string>();
    const splitIds = new Set<string>();
    const visit = (tree: LaymanTree<TData>) => {
        if ("tabs" in tree) {
            windowIds.add(tree.id);
            return;
        }
        splitIds.add(tree.id);
        tree.children.forEach(visit);
    };
    if (layout) visit(layout);
    return {windowIds, splitIds};
}

export function replaceTreeAtPath<TData extends JsonValue>(
    layout: LaymanLayout<TData>,
    path: TreePath,
    replacement: LaymanLayout<TData>
): LaymanLayout<TData> {
    if (!layout) return layout;
    if (path.length === 0) return replacement;
    if ("tabs" in layout) return layout;
    const [index, ...rest] = path;
    const current = layout.children[index];
    if (!current) return layout;
    const updated = replaceTreeAtPath(current, rest, replacement);
    if (updated === current) return layout;
    const children = [...layout.children];
    if (!updated) return layout;
    children[index] = updated;
    return {...layout, children: toChildren(children)};
}

function rescaleAfterRemoval<TData extends JsonValue>(children: readonly LaymanTree<TData>[], removedIndex: number): LaymanTree<TData>[] {
    const removedPercent = children[removedIndex]?.viewPercent;
    const remaining = children.filter((_child, index) => index !== removedIndex);
    return remaining.map((child) => {
        const viewPercent = child.viewPercent ?? 100 / children.length;
        const nextPercent = removedPercent
            ? (viewPercent * 100) / (100 - removedPercent)
            : (viewPercent * children.length) / (children.length - 1);
        return cloneTreeWithPercent(child, nextPercent);
    });
}

function nodeAfterRemoval<TData extends JsonValue>(node: LaymanNode<TData>, children: readonly LaymanTree<TData>[]): LaymanTree<TData> {
    if (children.length === 1) return cloneTreeWithPercent(children[0], node.viewPercent);
    return {...node, children: toChildren(children)};
}

/** Removes a tiled window and collapses empty split levels. */
export function removeTreeWindow<TData extends JsonValue>(layout: LaymanLayout<TData>, path: TreePath): LaymanLayout<TData> {
    if (!layout) return layout;
    if (path.length === 0) return undefined;
    if ("tabs" in layout) return layout;

    const [index, ...rest] = path;
    if (rest.length === 0) {
        if (index < 0 || index >= layout.children.length) return layout;
        const children = rescaleAfterRemoval(layout.children, index);
        return nodeAfterRemoval(layout, children);
    }

    const current = layout.children[index];
    if (!current || "tabs" in current) return layout;
    const updated = removeTreeWindow(current, rest);
    if (updated === current) return layout;
    if (!updated) {
        const children = rescaleAfterRemoval(layout.children, index);
        return nodeAfterRemoval(layout, children);
    }
    const children = [...layout.children];
    children[index] = updated;
    return {...layout, children: toChildren(children)};
}

export function updateTreeWindow<TData extends JsonValue>(
    layout: LaymanLayout<TData>,
    path: TreePath,
    update: (window: LaymanWindow<TData>) => LaymanWindow<TData> | undefined
): LaymanLayout<TData> {
    if (!layout) return layout;
    if (path.length === 0) return "tabs" in layout ? update(layout) : layout;
    if ("tabs" in layout) return layout;
    const [index, ...rest] = path;
    const current = layout.children[index];
    if (!current) return layout;
    const updated = updateTreeWindow(current, rest, update);
    if (updated === current) return layout;
    if (!updated) {
        const children = rescaleAfterRemoval(layout.children, index);
        return nodeAfterRemoval(layout, children);
    }
    const children = [...layout.children];
    children[index] = updated;
    return {...layout, children: toChildren(children)};
}

function edgeDirection(placement: LaymanPlacement): LaymanDirection | undefined {
    if (placement === "left" || placement === "right") return "row";
    if (placement === "top" || placement === "bottom") return "column";
    return undefined;
}

function insertAt<TData extends JsonValue>(
    children: LaymanChildren<LaymanTree<TData>>,
    index: number,
    tree: LaymanTree<TData>
): LaymanChildren<LaymanTree<TData>> {
    const count = children.length;
    const scaled = children.map((child) => cloneTreeWithPercent(child, ((child.viewPercent ?? 100 / count) * count) / (count + 1)));
    return toChildren([...scaled.slice(0, index), {...tree, viewPercent: 100 / (count + 1)}, ...scaled.slice(index)]);
}

/** Inserts a window next to a stable target window. */
export function insertTreeWindow<TData extends JsonValue>(
    layout: LaymanLayout<TData>,
    path: TreePath,
    window: LaymanWindow<TData>,
    placement: Exclude<LaymanPlacement, "center">
): LaymanLayout<TData> {
    if (!layout) return window;
    const direction = edgeDirection(placement)!;
    const before = placement === "top" || placement === "left";

    if (path.length === 0) {
        if ("tabs" in layout) {
            return {
                id: createSplitId(layout, window.id, layout.id),
                direction,
                children: toChildren(before ? [window, layout] : [layout, window]),
            };
        }
        if (layout.direction === direction) {
            return {...layout, children: insertAt(layout.children, before ? 0 : layout.children.length, window)};
        }
        return {
            id: createSplitId(layout, window.id, layout.id),
            direction,
            children: toChildren(before ? [window, layout] : [layout, window]),
        };
    }

    if ("tabs" in layout) return layout;
    const [index, ...rest] = path;
    const target = layout.children[index];
    if (!target) return layout;
    if (rest.length > 0) {
        const updated = insertTreeWindow(target, rest, window, placement);
        if (updated === target || !updated) return layout;
        const children = [...layout.children];
        children[index] = updated;
        return {...layout, children: toChildren(children)};
    }
    if (layout.direction === direction) {
        return {...layout, children: insertAt(layout.children, before ? index : index + 1, window)};
    }
    const split: LaymanNode<TData> = {
        id: createSplitId(layout, window.id, target.id),
        direction,
        viewPercent: target.viewPercent,
        children: toChildren(before ? [window, {...target, viewPercent: 50}] : [{...target, viewPercent: 50}, window]),
    };
    const children = [...layout.children];
    children[index] = split;
    return {...layout, children: toChildren(children)};
}

export function autoArrangeTree<TData extends JsonValue>(layout: LaymanLayout<TData>): LaymanLayout<TData> {
    if (!layout || "tabs" in layout) return layout;
    const viewPercent = 100 / layout.children.length;
    let changed = false;
    const children = layout.children.map((child) => {
        const arranged = autoArrangeTree(child)!;
        const updated = arranged.viewPercent === viewPercent ? arranged : {...arranged, viewPercent};
        if (updated !== child) changed = true;
        return updated;
    });
    return changed ? {...layout, children: toChildren(children)} : layout;
}
