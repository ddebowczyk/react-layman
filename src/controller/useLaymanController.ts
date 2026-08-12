import {useRef, useState} from "react";
import type {JsonValue, LaymanState} from "../core/model";
import {createLaymanControllerStore, type LaymanControllerStore} from "./createLaymanController";
import type {LaymanController, LaymanControllerOptions, LaymanControllerTransition} from "./types";

export interface UseLaymanControllerOptions<TData extends JsonValue> {
    state?: LaymanState<TData>;
    defaultState?: LaymanState<TData>;
    onStateChange?: LaymanControllerOptions<TData>["onStateChange"];
    onTransition?: LaymanControllerOptions<TData>["onTransition"];
}

function emptyState<TData extends JsonValue>(): LaymanState<TData> {
    return {layout: undefined, floatingWindows: []};
}

/**
 * Creates the public controller used by a Layman view.
 *
 * Supply `state` and `onStateChange` for a controlled host. Supply
 * `defaultState` for an isolated local view.
 */
export function useLaymanController<TData extends JsonValue>(
    options: UseLaymanControllerOptions<TData>
): LaymanController<TData> {
    const controlled = options.state !== undefined;
    if (controlled && options.defaultState !== undefined) {
        throw new Error("[Layman] use either state or defaultState, not both");
    }
    if (controlled && !options.onStateChange) {
        throw new Error("[Layman] controlled state requires onStateChange");
    }

    const [localState, setLocalState] = useState<LaymanState<TData>>(() => options.defaultState ?? emptyState<TData>());
    const state = options.state ?? localState;
    const controllerRef = useRef<LaymanControllerStore<TData> | null>(null);
    const controlledRef = useRef(controlled);
    if (controlledRef.current !== controlled) throw new Error("[Layman] controlled mode cannot change after setup");

    const onStateChange = (next: LaymanState<TData>, transition: LaymanControllerTransition<TData>) => {
        if (controlled) options.onStateChange?.(next, transition);
        else setLocalState(next);
    };
    const callbacks: LaymanControllerOptions<TData> = {state, onStateChange, onTransition: options.onTransition};
    if (!controllerRef.current) controllerRef.current = createLaymanControllerStore(callbacks);
    controllerRef.current.sync(state, {onStateChange, onTransition: options.onTransition});
    return controllerRef.current;
}
