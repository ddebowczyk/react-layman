import {Position} from "./types";

export function measureLaymanRoot(root: HTMLElement | null): Position | null {
    if (!root) return null;
    const {top, left, width, height} = root.getBoundingClientRect();
    return {top, left, width, height};
}

export function readLaymanStyleNumber(root: HTMLElement | null, name: string, fallback: number): number {
    if (!root) return fallback;
    const value = Number.parseInt(window.getComputedStyle(root).getPropertyValue(name).trim(), 10);
    return Number.isFinite(value) ? value : fallback;
}
