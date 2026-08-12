/** JSON values are the only values that may cross the Layman host boundary. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | {readonly [key: string]: JsonValue};

export type LaymanDirection = "column" | "row";
export type LaymanPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface Position {
    top: number;
    left: number;
    width: number;
    height: number;
}

export interface LaymanTab<TData extends JsonValue = JsonValue> {
    id: string;
    title: string;
    data: TData;
}

export interface LaymanWindow<TData extends JsonValue = JsonValue> {
    id: string;
    viewPercent?: number;
    tabs: readonly LaymanTab<TData>[];
    selectedTabId: string | null;
}

export type LaymanTree<TData extends JsonValue = JsonValue> = LaymanWindow<TData> | LaymanNode<TData>;
export type LaymanChildren<T> = readonly [T, T, ...T[]];

export interface LaymanNode<TData extends JsonValue = JsonValue> {
    id: string;
    direction: LaymanDirection;
    viewPercent?: number;
    children: LaymanChildren<LaymanTree<TData>>;
}

export type LaymanLayout<TData extends JsonValue = JsonValue> = LaymanTree<TData> | undefined;

export interface FloatingWindowData<TData extends JsonValue = JsonValue> {
    id: string;
    tabs: readonly LaymanTab<TData>[];
    selectedTabId: string | null;
    position: Position;
    zIndex: number;
}

export interface LaymanState<TData extends JsonValue = JsonValue> {
    layout: LaymanLayout<TData>;
    floatingWindows: readonly FloatingWindowData<TData>[];
}
