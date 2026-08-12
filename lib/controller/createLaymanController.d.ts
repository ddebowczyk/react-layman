import { JsonValue, LaymanState } from '../core/model';
import { LaymanController, LaymanControllerOptions, LaymanControllerTransition, LaymanTransitionListener } from './types';
import { LaymanInteractionPolicy } from './policy';
interface LaymanControllerCallbacks<TData extends JsonValue> {
    onStateChange?: (state: LaymanState<TData>, transition: LaymanControllerTransition<TData>) => void;
    onTransition?: LaymanTransitionListener<TData>;
    interaction?: LaymanInteractionPolicy<TData>;
}
export interface LaymanControllerStore<TData extends JsonValue> extends LaymanController<TData> {
    sync(state: LaymanState<TData>, callbacks: LaymanControllerCallbacks<TData>): void;
}
export declare function createLaymanControllerStore<TData extends JsonValue>(options: LaymanControllerOptions<TData>): LaymanControllerStore<TData>;
/** Creates an inspectable controller that owns no rendering concerns. */
export declare function createLaymanController<TData extends JsonValue>(options: LaymanControllerOptions<TData>): LaymanController<TData>;
export {};
