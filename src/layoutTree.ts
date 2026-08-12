import {createLaymanWindow} from "./createLaymanTab";
import {getLayoutAtPath, setLayoutAtPath} from "./layoutPath";
import type {Children, LaymanLayout, LaymanPath, LaymanTab, LaymanWindow, MoveSeparatorAction} from "./types";
import {deepClone} from "./utils";

export function addTabToLayout(layout: LaymanLayout, path: LaymanPath, tab: LaymanTab): LaymanLayout {
    if (!layout) return createLaymanWindow([tab]);
    const window = getLayoutAtPath(layout, path);
    if (!window || !("tabs" in window)) return layout;

    const updatedWindow = {...window, tabs: [...window.tabs, tab]};
    return path.length === 0 ? updatedWindow : setLayoutAtPath(layout, path, updatedWindow);
}

function scaledChildrenAfterRemoval(parent: Exclude<LaymanLayout, LaymanWindow | undefined>, removedIndex: number): LaymanLayout[] {
    const removedViewPercent = parent.children[removedIndex]?.viewPercent;
    return parent.children
        .filter((_child, index) => index !== removedIndex)
        .map((child) => {
            if (!child) return child;
            const viewPercent = child.viewPercent ?? 100 / parent.children.length;
            return {
                ...child,
                viewPercent: removedViewPercent
                    ? (viewPercent * 100) / (100 - removedViewPercent)
                    : (viewPercent * parent.children.length) / (parent.children.length - 1),
            };
        });
}

function mergeSameDirectionParent(
    layout: LaymanLayout,
    parentPath: LaymanPath,
    onlyChild: Exclude<LaymanLayout, LaymanWindow | undefined>
): LaymanLayout {
    const grandparentPath = parentPath.slice(0, -1);
    const grandparent = getLayoutAtPath(layout, grandparentPath);
    if (!grandparent || !("children" in grandparent)) return layout;

    const parentIndex = parentPath[parentPath.length - 1];
    const divisor = grandparent.children.length + onlyChild.children.length - 1;
    const scale = (child: LaymanLayout, count: number): LaymanLayout =>
        child && child.viewPercent ? {...child, viewPercent: (child.viewPercent * count) / divisor} : child;
    const merged: LaymanLayout = {
        ...grandparent,
        children: [
            ...grandparent.children.slice(0, parentIndex).map((child) => scale(child, grandparent.children.length)),
            ...onlyChild.children.map((child) => scale(child, onlyChild.children.length)),
            ...grandparent.children.slice(parentIndex + 1).map((child) => scale(child, grandparent.children.length)),
        ] as Children<LaymanLayout>,
    };
    return grandparentPath.length === 0 ? merged : setLayoutAtPath(layout, grandparentPath, merged);
}

export function removeWindowFromLayout(layout: LaymanLayout, path: LaymanPath): LaymanLayout {
    if (!layout) return layout;
    const parentPath = path.slice(0, -1);
    const parent = getLayoutAtPath(layout, parentPath);
    if (!parent || !("children" in parent)) return undefined;

    const children = scaledChildrenAfterRemoval(parent, path[path.length - 1]);
    if (children.length !== 1) {
        const updatedParent = {...parent, children: children as Children<LaymanLayout>};
        return parentPath.length === 0 ? updatedParent : setLayoutAtPath(layout, parentPath, updatedParent);
    }

    const onlyChild = children[0]!;
    if ("tabs" in onlyChild) {
        const promotedWindow = {...onlyChild, viewPercent: parent.viewPercent};
        return parentPath.length === 0 ? promotedWindow : setLayoutAtPath(layout, parentPath, promotedWindow);
    }

    const grandparent = getLayoutAtPath(layout, parentPath.slice(0, -1));
    if (!grandparent || !("children" in grandparent)) return layout;
    if (grandparent.direction === onlyChild.direction) return mergeSameDirectionParent(layout, parentPath, onlyChild);
    return parentPath.length === 0 ? onlyChild : setLayoutAtPath(layout, parentPath, onlyChild);
}

export function removeTabFromLayout(layout: LaymanLayout, path: LaymanPath, tab: LaymanTab): LaymanLayout {
    if (!layout) return layout;
    const window = getLayoutAtPath(layout, path);
    if (!window || !("tabs" in window)) return layout;

    const removedIndex = window.tabs.findIndex((currentTab) => currentTab.id === tab.id);
    if (removedIndex === -1) return layout;
    const tabs = window.tabs.filter((currentTab) => currentTab.id !== tab.id);
    if (tabs.length === 0) return removeWindowFromLayout(layout, path);

    const selectedTabId =
        window.selectedTabId === tab.id ? tabs[Math.min(removedIndex, tabs.length - 1)]?.id ?? null : window.selectedTabId;
    const updatedWindow = {...window, tabs, selectedTabId};
    return path.length === 0 ? updatedWindow : setLayoutAtPath(layout, path, updatedWindow);
}

export function selectLayoutTab(layout: LaymanLayout, path: LaymanPath, tab: LaymanTab): LaymanLayout {
    if (!layout) return layout;
    const window = getLayoutAtPath(layout, path);
    if (!window || !("tabs" in window) || !window.tabs.some((currentTab) => currentTab.id === tab.id)) return layout;
    const updatedWindow = {...window, selectedTabId: tab.id};
    return path.length === 0 ? updatedWindow : setLayoutAtPath(layout, path, updatedWindow);
}

function insertChild(children: Children<LaymanLayout>, index: number, window: LaymanWindow): Children<LaymanLayout> {
    const count = children.length;
    const scale = (child: LaymanLayout): LaymanLayout =>
        child ? {...child, viewPercent: child.viewPercent ? (child.viewPercent * count) / (count + 1) : child.viewPercent} : child;
    return [...children.slice(0, index).map(scale), {...window, viewPercent: 100 / (count + 1)}, ...children.slice(index).map(scale)] as Children<LaymanLayout>;
}

export function addWindowToLayout(
    layout: LaymanLayout,
    path: LaymanPath,
    window: LaymanWindow,
    placement: "top" | "bottom" | "left" | "right"
): LaymanLayout {
    if (!layout) return {...window};
    const parentPath = path.slice(0, -1);
    const parent = getLayoutAtPath(layout, parentPath);
    if (!parent) return layout;

    const isColumn = placement === "top" || placement === "bottom";
    const before = placement === "top" || placement === "left";
    if (!("children" in parent)) {
        return {direction: isColumn ? "column" : "row", children: (before ? [window, parent] : [parent, window]) as Children<LaymanLayout>};
    }

    if (path.length === 0) {
        const sameDirection = (isColumn && parent.direction === "column") || (!isColumn && parent.direction === "row");
        if (sameDirection) return {...parent, children: insertChild(parent.children, before ? 0 : parent.children.length, window)};
        return {direction: isColumn ? "column" : "row", children: (before ? [window, parent] : [parent, window]) as Children<LaymanLayout>};
    }

    const lastIndex = path[path.length - 1];
    const insertionIndex = before ? lastIndex : lastIndex + 1;
    const sameDirection = (isColumn && parent.direction === "column") || (!isColumn && parent.direction === "row");
    if (sameDirection) {
        const updatedParent = {...parent, children: insertChild(parent.children, insertionIndex, window)};
        return path.length === 1 ? updatedParent : setLayoutAtPath(layout, parentPath, updatedParent);
    }

    const existingWindow = getLayoutAtPath(layout, path);
    if (!existingWindow || !("tabs" in existingWindow)) return layout;
    const children = (before
        ? [window, {...existingWindow, viewPercent: 50}]
        : [{...existingWindow, viewPercent: 50}, window]) as Children<LaymanLayout>;
    const updatedParent = {
        ...parent,
        children: parent.children.map((child, index) =>
            index === lastIndex ? {direction: isColumn ? "column" : "row", children, viewPercent: existingWindow.viewPercent} : child
        ) as Children<LaymanLayout>,
    };
    return path.length === 1 ? updatedParent : setLayoutAtPath(layout, parentPath, updatedParent);
}

export function moveLayoutSeparator(layout: LaymanLayout, action: MoveSeparatorAction): LaymanLayout {
    if (!layout) return layout;
    const node = getLayoutAtPath(layout, action.path);
    if (!node || !("children" in node)) return layout;

    const count = node.children.length;
    const left = node.children[action.index]?.viewPercent ?? 100 / count;
    const right = node.children[action.index + 1]?.viewPercent ?? 100 / count;
    const updatedNode = deepClone(node);
    updatedNode.children[action.index]!.viewPercent = action.newSplitPercentage;
    updatedNode.children[action.index + 1]!.viewPercent = left + right - action.newSplitPercentage;
    return action.path.length === 0 ? updatedNode : setLayoutAtPath(layout, action.path, updatedNode);
}

export function addTabWithHeuristic(layout: LaymanLayout, tab: LaymanTab, heuristic: "topleft" | "topright"): LaymanLayout {
    if (!layout) return createLaymanWindow([tab]);
    if ("tabs" in layout) return {...layout, tabs: [...layout.tabs, tab], selectedTabId: tab.id};

    const children: Children<LaymanLayout> = [...layout.children];
    const index = heuristic === "topleft" || layout.direction === "column" ? 0 : children.length - 1;
    children[index] = addTabWithHeuristic(children[index], tab, heuristic);
    return {...layout, children};
}

export function autoArrangeLayout(layout: LaymanLayout): LaymanLayout {
    if (!layout || "tabs" in layout) return layout;
    const viewPercent = 100 / layout.children.length;
    return {
        ...layout,
        children: layout.children.map((child) => ({...autoArrangeLayout(child), viewPercent})) as Children<LaymanLayout>,
    };
}
