import { JsonValue } from '../core/model';
import { ToolbarActionRuntime } from './builtinActions';
import { LaymanToolbarConfig, LaymanToolbarContext, LaymanToolbarItem, LaymanToolbarSurface, LaymanToolbarWidgetProps } from './types';
/** Resolves one host toolbar list and rejects unstable item identities early. */
export declare function resolveToolbarItems<TData extends JsonValue>(config: LaymanToolbarConfig<TData>, context: LaymanToolbarContext<TData>): readonly LaymanToolbarItem<TData>[];
export declare function toolbarItemProps<TData extends JsonValue>(item: LaymanToolbarItem<TData>, runtime: ToolbarActionRuntime<TData>): LaymanToolbarWidgetProps<TData>;
export declare function toolbarItemsForSurface<TData extends JsonValue>(items: readonly LaymanToolbarItem<TData>[], runtime: ToolbarActionRuntime<TData>, surface: LaymanToolbarSurface): readonly LaymanToolbarItem<TData>[];
export declare function hasToolbarSurfaceItems<TData extends JsonValue>(items: readonly LaymanToolbarItem<TData>[], runtime: ToolbarActionRuntime<TData>, surface: LaymanToolbarSurface): boolean;
