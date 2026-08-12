import { JsonValue, LaymanState } from '../core/model';
import { LaymanController, LaymanControllerOptions } from './types';
export interface UseLaymanControllerOptions<TData extends JsonValue> {
    state?: LaymanState<TData>;
    defaultState?: LaymanState<TData>;
    onStateChange?: LaymanControllerOptions<TData>["onStateChange"];
    onTransition?: LaymanControllerOptions<TData>["onTransition"];
    interaction?: LaymanControllerOptions<TData>["interaction"];
}
/**
 * Creates the public controller used by a Layman view.
 *
 * Supply `state` and `onStateChange` for a controlled host. Supply
 * `defaultState` for an isolated local view.
 */
export declare function useLaymanController<TData extends JsonValue>(options: UseLaymanControllerOptions<TData>): LaymanController<TData>;
