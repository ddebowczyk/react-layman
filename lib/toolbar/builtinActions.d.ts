import { LaymanLayout, Position } from '../types';
import { JsonValue } from '../core/model';
import { LaymanBuiltinToolbarItem, LaymanToolbarConfig, LaymanToolbarContext, LaymanToolbarWidgetProps } from './types';
export interface ToolbarActionRuntime<TData extends JsonValue = JsonValue> {
    config: LaymanToolbarConfig<TData>;
    context: LaymanToolbarContext<TData>;
    layout: LaymanLayout<TData>;
    rawPosition: Position;
    container: Position;
    atMaxDepth: boolean;
    setMaximized: (windowId: string | null) => void;
}
export declare function builtinToolbarWidgetProps<TData extends JsonValue>(item: LaymanBuiltinToolbarItem<TData>, runtime: ToolbarActionRuntime<TData>): LaymanToolbarWidgetProps<TData>;
