import { JsonValue } from '../core/model';
import { ToolbarActionRuntime } from './builtinActions';
import { LaymanToolbarItem, LaymanToolbarSurface } from './types';
interface WindowToolbarWidgetsProps<TData extends JsonValue> {
    items: readonly LaymanToolbarItem<TData>[];
    runtime: ToolbarActionRuntime<TData>;
    surface: LaymanToolbarSurface;
}
/** Renders declarative host items on one toolbar surface in declared order. */
export declare function WindowToolbarWidgets<TData extends JsonValue>({ items, runtime, surface }: WindowToolbarWidgetsProps<TData>): import("react").JSX.Element;
export {};
