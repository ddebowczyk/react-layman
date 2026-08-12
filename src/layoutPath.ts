import type {LaymanLayout, LaymanPath} from "./types";
import {deepClone} from "./utils";

export function getLayoutAtPath(layout: LaymanLayout, path: LaymanPath): LaymanLayout {
    let current = layout;
    for (const index of path) {
        if (!current || !("children" in current)) return undefined;
        current = current.children[index];
    }
    return current;
}

export function setLayoutAtPath(layout: LaymanLayout, path: LaymanPath, value: LaymanLayout): LaymanLayout {
    const cloned = deepClone(layout);
    let current = cloned;
    for (let index = 0; index < path.length - 1; index += 1) {
        if (!current || !("children" in current)) return cloned;
        current = current.children[path[index]];
    }
    if (!current || !("children" in current)) return cloned;
    current.children[path[path.length - 1]] = value;
    return cloned;
}

/** Recalculates a destination tree path after the source window is removed. */
export function adjustPathAfterRemoval(layout: LaymanLayout, sourcePath: LaymanPath, destinationPath: LaymanPath): LaymanPath {
    let sharedLength = 0;
    while (sharedLength < sourcePath.length && sourcePath[sharedLength] === destinationPath[sharedLength]) {
        sharedLength += 1;
    }

    if (sharedLength !== sourcePath.length - 1) {
        if (sharedLength !== sourcePath.length - 2) return destinationPath;

        const adjustedPath = [...destinationPath];
        const parentPath = sourcePath.slice(0, -1);
        const parent = getLayoutAtPath(layout, parentPath);
        const grandparent = getLayoutAtPath(layout, parentPath.slice(0, -1));
        if (!parent || !("children" in parent) || !grandparent || !("children" in grandparent)) return adjustedPath;

        const survivingChild = parent.children[sourcePath[sourcePath.length - 1] === 1 ? 0 : 1];
        if (!survivingChild || !("children" in survivingChild)) return adjustedPath;
        if (grandparent.direction === survivingChild.direction && adjustedPath[sharedLength] > sourcePath[sharedLength]) {
            adjustedPath[sharedLength] += survivingChild.children.length - 1;
        }
        return adjustedPath;
    }

    const adjustedPath = [...destinationPath];
    if (destinationPath[sharedLength] > sourcePath[sharedLength]) {
        adjustedPath[sharedLength] = destinationPath[sharedLength] - 1;
    }

    const parentPath = sourcePath.slice(0, -1);
    const parent = getLayoutAtPath(layout, parentPath);
    if (!parent || !("children" in parent) || parent.children.length !== 2) return adjustedPath;

    adjustedPath.splice(sharedLength, 1);
    const grandparent = getLayoutAtPath(layout, parentPath.slice(0, -1));
    const survivingChild = parent.children[sourcePath[sourcePath.length - 1] === 1 ? 0 : 1];
    if (!grandparent || !("children" in grandparent) || !survivingChild || !("children" in survivingChild)) return adjustedPath;

    if (grandparent.direction === survivingChild.direction) {
        adjustedPath[sharedLength - 1] += adjustedPath[sharedLength];
        adjustedPath.splice(sharedLength, 1);
    }
    return adjustedPath;
}
