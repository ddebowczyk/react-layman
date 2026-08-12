import { LaymanChange, LaymanCommand, LaymanRejectionReason } from '../core/commands';
import { LaymanInspection } from '../core/inspection';
import { JsonValue, LaymanState } from '../core/model';
import { LaymanInteractionDecision, LaymanInteractionPolicy, LaymanInteractionViewConfig } from './policy';
export type LaymanCommandOrigin = "host" | "restore" | "tauri" | "user";
export interface LaymanCommandMeta {
    origin?: LaymanCommandOrigin;
    requestId?: string;
    view?: Readonly<LaymanInteractionViewConfig>;
}
export interface LaymanControllerTransition<TData extends JsonValue = JsonValue> {
    kind: "command" | "state.replace";
    status: "applied" | "noop" | "rejected";
    reason?: LaymanRejectionReason;
    denial?: Extract<LaymanInteractionDecision, {
        kind: "deny";
    }>;
    command?: LaymanCommand<TData>;
    meta: Readonly<LaymanCommandMeta>;
    revision: number;
    previous: Readonly<LaymanState<TData>>;
    next: Readonly<LaymanState<TData>>;
    changes: readonly LaymanChange[];
}
export type LaymanTransitionListener<TData extends JsonValue = JsonValue> = (transition: LaymanControllerTransition<TData>) => void;
export type LaymanCommandDispatcher<TData extends JsonValue = JsonValue> = (command: LaymanCommand<TData>) => LaymanControllerTransition<TData>;
export type LaymanControllerDispatch<TData extends JsonValue = JsonValue> = (command: LaymanCommand<TData>, meta?: LaymanCommandMeta) => LaymanControllerTransition<TData>;
export type LaymanCommandAuthorizer<TData extends JsonValue = JsonValue> = (command: LaymanCommand<TData>, meta?: LaymanCommandMeta) => LaymanInteractionDecision;
export interface LaymanController<TData extends JsonValue = JsonValue> {
    dispatch: LaymanControllerDispatch<TData>;
    canExecute: LaymanCommandAuthorizer<TData>;
    replaceState(state: LaymanState<TData>, meta?: LaymanCommandMeta): LaymanControllerTransition<TData>;
    getState(): Readonly<LaymanState<TData>>;
    inspect(): LaymanInspection<TData>;
    subscribe(listener: LaymanTransitionListener<TData>): () => void;
}
export interface LaymanControllerOptions<TData extends JsonValue = JsonValue> {
    state: LaymanState<TData>;
    interaction?: LaymanInteractionPolicy<TData>;
    onStateChange?: (state: LaymanState<TData>, transition: LaymanControllerTransition<TData>) => void;
    onTransition?: LaymanTransitionListener<TData>;
}
