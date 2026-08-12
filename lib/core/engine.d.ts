import { LaymanCommand, LaymanTransition } from './commands';
import { JsonValue, LaymanState } from './model';
/** Applies one semantic command immutably. Rejections and no-ops retain the exact state reference. */
export declare function applyLaymanCommand<TData extends JsonValue>(state: LaymanState<TData>, command: LaymanCommand<TData>): LaymanTransition<TData>;
