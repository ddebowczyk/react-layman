import {applyLaymanCommand} from "../core/engine";
import {inspectLaymanState} from "../core/inspection";
import type {JsonValue, LaymanState} from "../core/model";
import {validateLaymanState} from "../core/validation";
import type {
    LaymanCommandMeta,
    LaymanController,
    LaymanControllerOptions,
    LaymanControllerTransition,
    LaymanTransitionListener,
} from "./types";

interface LaymanControllerCallbacks<TData extends JsonValue> {
    onStateChange?: (state: LaymanState<TData>, transition: LaymanControllerTransition<TData>) => void;
    onTransition?: LaymanTransitionListener<TData>;
}

export interface LaymanControllerStore<TData extends JsonValue> extends LaymanController<TData> {
    sync(state: LaymanState<TData>, callbacks: LaymanControllerCallbacks<TData>): void;
}

function resolvedMeta(meta: LaymanCommandMeta | undefined, origin: LaymanCommandMeta["origin"]): Readonly<LaymanCommandMeta> {
    return {origin, ...meta};
}

export function createLaymanControllerStore<TData extends JsonValue>(options: LaymanControllerOptions<TData>): LaymanControllerStore<TData> {
    const initialValidation = validateLaymanState(options.state);
    if (!initialValidation.valid) throw new Error(`[Layman] controller state is invalid: ${initialValidation.issues.join(", ")}`);

    let state = options.state;
    let callbacks: LaymanControllerCallbacks<TData> = options;
    let revision = 0;
    const listeners = new Set<LaymanTransitionListener<TData>>();

    const emit = (transition: LaymanControllerTransition<TData>) => {
        if (transition.status === "applied") callbacks.onStateChange?.(transition.next as LaymanState<TData>, transition);
        callbacks.onTransition?.(transition);
        listeners.forEach((listener) => listener(transition));
    };

    const store: LaymanControllerStore<TData> = {
        dispatch(command, meta) {
            if (meta?.allowed === false) {
                const transition: LaymanControllerTransition<TData> = {
                    kind: "command",
                    status: "rejected",
                    reason: "forbidden",
                    command,
                    meta: resolvedMeta(meta, "host"),
                    revision,
                    previous: state,
                    next: state,
                    changes: [],
                };
                emit(transition);
                return transition;
            }
            const result = applyLaymanCommand(state, command);
            if (result.status === "applied") state = result.next;
            if (result.status === "applied") revision += 1;
            const transition: LaymanControllerTransition<TData> = {
                kind: "command",
                status: result.status,
                reason: result.reason,
                command,
                meta: resolvedMeta(meta, "host"),
                revision,
                previous: result.previous,
                next: result.next,
                changes: result.changes,
            };
            emit(transition);
            return transition;
        },
        replaceState(next, meta) {
            const validation = validateLaymanState(next);
            const applied = validation.valid && next !== state;
            if (applied) revision += 1;
            const transition: LaymanControllerTransition<TData> = {
                kind: "state.replace",
                status: validation.valid ? (applied ? "applied" : "noop") : "rejected",
                reason: validation.valid ? undefined : "invalid-state",
                meta: resolvedMeta(meta, "host"),
                revision,
                previous: state,
                next: validation.valid ? next : state,
                changes: [],
            };
            if (applied) state = next;
            emit(transition);
            return transition;
        },
        getState: () => state,
        inspect: () => inspectLaymanState(state),
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        sync(next, nextCallbacks) {
            state = next;
            callbacks = nextCallbacks;
        },
    };
    return store;
}

/** Creates an inspectable controller that owns no rendering concerns. */
export function createLaymanController<TData extends JsonValue>(options: LaymanControllerOptions<TData>): LaymanController<TData> {
    return createLaymanControllerStore(options);
}
