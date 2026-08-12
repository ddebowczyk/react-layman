import type {LaymanCommand} from "../core/commands";
import type {LaymanInspection} from "../core/inspection";
import type {JsonValue, LaymanState} from "../core/model";
import type {LaymanSerializedState} from "../types";
import type {LaymanController, LaymanControllerTransition} from "../controller/types";

/** A versioned layout record exchanged with application persistence. */
export interface LaymanWorkspaceUpdate {
    revision: number;
    originId: string;
    snapshot: unknown;
}

export type LaymanWorkspaceUnsubscribe = () => void | Promise<void>;

/**
 * The persistence and event port implemented by an application host.
 *
 * `save` must reject writes older than its current revision. This gives the
 * application, not Layman, authority over concurrent workspace writes.
 */
export interface LaymanSnapshotPort {
    load(workspaceId: string): Promise<LaymanWorkspaceUpdate | undefined>;
    save(workspaceId: string, update: Readonly<LaymanWorkspaceUpdate & {snapshot: LaymanSerializedState}>): Promise<void>;
    subscribe?(workspaceId: string, receive: (update: LaymanWorkspaceUpdate) => void): LaymanWorkspaceUnsubscribe | Promise<LaymanWorkspaceUnsubscribe>;
}

/** The native-window or embedded-module operations owned by the application. */
export interface LaymanModuleHost<TModule> {
    open(module: TModule): Promise<void>;
    focus(moduleId: string): Promise<void>;
    close(moduleId: string): Promise<void>;
}

export interface LaymanWorkspaceInspection<TData extends JsonValue = JsonValue> {
    workspaceId: string;
    revision: number;
    layout: LaymanInspection<TData>;
    snapshot: LaymanSerializedState;
}

export type LaymanWorkspaceBridgeEvent<TData extends JsonValue = JsonValue> =
    | {type: "transition"; transition: LaymanControllerTransition<TData>}
    | {type: "restored"; workspaceId: string; revision: number}
    | {type: "external-update-applied"; workspaceId: string; revision: number; transition: LaymanControllerTransition<TData>}
    | {type: "external-update-ignored"; workspaceId: string; revision: number; reason: "echo" | "stale"}
    | {type: "load-failed" | "save-failed" | "subscribe-failed" | "external-update-failed"; workspaceId: string; message: string}
    | {type: "module-failed"; workspaceId: string; operation: "open" | "focus" | "close"; message: string};

export interface LaymanWorkspaceBridgeOptions<TData extends JsonValue> {
    workspaceId: string;
    originId: string;
    controller: LaymanController<TData>;
    snapshots: LaymanSnapshotPort;
    modules?: LaymanModuleHost<TData>;
    onEvent?: (event: LaymanWorkspaceBridgeEvent<TData>) => void;
}

export interface LaymanWorkspaceBridge<TData extends JsonValue = JsonValue> {
    readonly controller: LaymanController<TData>;
    start(): Promise<void>;
    stop(): Promise<void>;
    flush(): Promise<void>;
    inspect(): LaymanWorkspaceInspection<TData>;
    dispatch(command: LaymanCommand<TData>, requestId?: string): LaymanControllerTransition<TData>;
    replaceState(state: LaymanState<TData>, requestId?: string): LaymanControllerTransition<TData>;
    receive(update: LaymanWorkspaceUpdate): LaymanControllerTransition<TData> | undefined;
    openModule(module: TData): Promise<boolean>;
    focusModule(moduleId: string): Promise<boolean>;
    closeModule(moduleId: string): Promise<boolean>;
    subscribe(listener: (event: LaymanWorkspaceBridgeEvent<TData>) => void): () => void;
}
