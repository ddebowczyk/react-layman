export interface LaymanViewMetrics {
    separatorThickness: number;
    toolbarHeight: number;
    dockZoneInset: number;
    floatingResizeHandleSize: number;
}
export declare const defaultLaymanViewMetrics: LaymanViewMetrics;
/** Reads layout measurements from one view root, never from the document. */
export declare function readLaymanViewMetrics(root: HTMLElement): LaymanViewMetrics;
export declare function sameLaymanViewMetrics(a: LaymanViewMetrics, b: LaymanViewMetrics): boolean;
