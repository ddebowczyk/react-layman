import { JsonValue, LaymanDirection, LaymanNode, LaymanTab, LaymanTree, LaymanWindow } from './core/model';
/** Creates a plain, stable tab value for a Layman layout. */
export declare function createLaymanTab<TData extends JsonValue>(title: string, data: TData, id?: string): LaymanTab<TData>;
/** Creates a window with a valid initial selection. */
export declare function createLaymanWindow<TData extends JsonValue>(tabs: readonly LaymanTab<TData>[], id?: string, selectedTabId?: string): LaymanWindow<TData>;
/** Creates a split with a stable ID and at least two children. */
export declare function createLaymanNode<TData extends JsonValue>(direction: LaymanDirection, children: readonly [LaymanTree<TData>, LaymanTree<TData>, ...LaymanTree<TData>[]], id?: string): LaymanNode<TData>;
