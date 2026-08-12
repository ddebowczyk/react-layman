export interface LaymanViewMetrics {
    separatorThickness: number;
    toolbarHeight: number;
    dockZoneInset: number;
    floatingResizeHandleSize: number;
}

export const defaultLaymanViewMetrics: LaymanViewMetrics = {
    separatorThickness: 4,
    toolbarHeight: 32,
    dockZoneInset: 16,
    floatingResizeHandleSize: 8,
};

function cssPixels(style: CSSStyleDeclaration, variable: string, fallback: number): number {
    const value = Number.parseFloat(style.getPropertyValue(variable));
    return Number.isFinite(value) ? value : fallback;
}

/** Reads layout measurements from one view root, never from the document. */
export function readLaymanViewMetrics(root: HTMLElement): LaymanViewMetrics {
    const style = getComputedStyle(root);
    return {
        separatorThickness: cssPixels(style, "--layman-separator-thickness", defaultLaymanViewMetrics.separatorThickness),
        toolbarHeight: cssPixels(style, "--layman-toolbar-height", defaultLaymanViewMetrics.toolbarHeight),
        dockZoneInset: cssPixels(style, "--layman-dock-zone-inset", defaultLaymanViewMetrics.dockZoneInset),
        floatingResizeHandleSize: cssPixels(
            style,
            "--layman-floating-resize-handle-size",
            defaultLaymanViewMetrics.floatingResizeHandleSize
        ),
    };
}

export function sameLaymanViewMetrics(a: LaymanViewMetrics, b: LaymanViewMetrics): boolean {
    return (
        a.separatorThickness === b.separatorThickness &&
        a.toolbarHeight === b.toolbarHeight &&
        a.dockZoneInset === b.dockZoneInset &&
        a.floatingResizeHandleSize === b.floatingResizeHandleSize
    );
}
