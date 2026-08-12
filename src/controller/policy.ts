import type {LaymanCommand} from "../core/commands";
import type {LaymanInspection} from "../core/inspection";
import type {JsonValue} from "../core/model";
import type {LaymanCommandOrigin} from "./types";

/** A compact description of the view that initiated a user command. */
export interface LaymanInteractionViewConfig {
    viewId: string;
    maxDepth: number;
    showTabs: boolean;
}

export interface LaymanInteractionContext<TData extends JsonValue = JsonValue> {
    command: LaymanCommand<TData>;
    inspection: LaymanInspection<TData>;
    origin: LaymanCommandOrigin;
    view?: Readonly<LaymanInteractionViewConfig>;
}

export type LaymanInteractionDecision = {kind: "allow"} | {kind: "deny"; reason: string};

export interface LaymanInteractionPolicy<TData extends JsonValue = JsonValue> {
    canExecute(context: LaymanInteractionContext<TData>): LaymanInteractionDecision;
}
