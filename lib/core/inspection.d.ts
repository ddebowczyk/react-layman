import { JsonValue, LaymanState } from './model';
export interface LaymanInspectedTab<TData extends JsonValue = JsonValue> {
    id: string;
    title: string;
    data: TData;
}
export interface LaymanInspectedWindow<TData extends JsonValue = JsonValue> {
    id: string;
    location: "tiled" | "floating";
    parentSplitId: string | null;
    siblingIds: readonly string[];
    selectedTabId: string | null;
    tabs: readonly LaymanInspectedTab<TData>[];
    position?: Readonly<{
        top: number;
        left: number;
        width: number;
        height: number;
    }>;
    zIndex?: number;
}
export interface LaymanInspectedSplit {
    id: string;
    parentSplitId: string | null;
    direction: "column" | "row";
    childIds: readonly string[];
}
export interface LaymanInspection<TData extends JsonValue = JsonValue> {
    rootId: string | null;
    windows: readonly LaymanInspectedWindow<TData>[];
    splits: readonly LaymanInspectedSplit[];
}
/** Builds a detached, JSON-friendly view of the complete layout graph. */
export declare function inspectLaymanState<TData extends JsonValue>(state: LaymanState<TData>): LaymanInspection<TData>;
