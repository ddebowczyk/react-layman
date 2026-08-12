import type {LaymanCommand} from "../core/commands";
import {deserializeState, serializeState} from "../layoutSnapshot";
import type {JsonValue, LaymanState} from "../core/model";
import type {LaymanControllerTransition, LaymanTransitionListener} from "../controller/types";
import type {
    LaymanModuleHost,
    LaymanWorkspaceBridge,
    LaymanWorkspaceBridgeEvent,
    LaymanWorkspaceBridgeOptions,
    LaymanWorkspaceInspection,
    LaymanWorkspaceUpdate,
    LaymanWorkspaceUnsubscribe,
} from "./types";

function message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function validUpdate(update: LaymanWorkspaceUpdate): boolean {
    return (
        typeof update.revision === "number" &&
        Number.isSafeInteger(update.revision) &&
        update.revision >= 0 &&
        typeof update.originId === "string" &&
        update.originId.trim().length > 0
    );
}

/**
 * Coordinates one controller with an application-owned persistence and module
 * host. The bridge has no Tauri imports; a Tauri view supplies the two ports.
 */
export function createLaymanWorkspaceBridge<TData extends JsonValue>(
    options: LaymanWorkspaceBridgeOptions<TData>
): LaymanWorkspaceBridge<TData> {
    if (!options.workspaceId.trim()) throw new Error("[Layman] workspaceId must not be empty");
    if (!options.originId.trim()) throw new Error("[Layman] originId must not be empty");

    const listeners = new Set<(event: LaymanWorkspaceBridgeEvent<TData>) => void>();
    if (options.onEvent) listeners.add(options.onEvent);

    let workspaceRevision = 0;
    let active = false;
    let stopController: (() => void) | undefined;
    let stopPort: LaymanWorkspaceUnsubscribe | undefined;
    let saves = Promise.resolve();
    let lifecycle: Promise<void> = Promise.resolve();

    const emit = (event: LaymanWorkspaceBridgeEvent<TData>) => listeners.forEach((listener) => listener(event));

    const queueSave = (transition: LaymanControllerTransition<TData>) => {
        if (transition.status !== "applied" || transition.meta.origin === "restore") return;
        const update = {
            revision: ++workspaceRevision,
            originId: options.originId,
            snapshot: serializeState(transition.next),
        };
        saves = saves.then(() => options.snapshots.save(options.workspaceId, update)).catch((error) => {
            emit({type: "save-failed", workspaceId: options.workspaceId, message: message(error)});
        });
    };

    const observe: LaymanTransitionListener<TData> = (transition) => {
        emit({type: "transition", transition});
        queueSave(transition);
    };

    const receive = (update: LaymanWorkspaceUpdate): LaymanControllerTransition<TData> | undefined => {
        if (!validUpdate(update)) {
            emit({type: "external-update-failed", workspaceId: options.workspaceId, message: "update revision and originId are required"});
            return undefined;
        }
        if (update.originId === options.originId) {
            emit({type: "external-update-ignored", workspaceId: options.workspaceId, revision: update.revision, reason: "echo"});
            return undefined;
        }
        if (update.revision <= workspaceRevision) {
            emit({type: "external-update-ignored", workspaceId: options.workspaceId, revision: update.revision, reason: "stale"});
            return undefined;
        }

        try {
            const state = deserializeState(update.snapshot) as LaymanState<TData>;
            workspaceRevision = update.revision;
            const transition = options.controller.replaceState(state, {origin: "restore", requestId: update.originId});
            emit({type: "external-update-applied", workspaceId: options.workspaceId, revision: workspaceRevision, transition});
            return transition;
        } catch (error) {
            emit({type: "external-update-failed", workspaceId: options.workspaceId, message: message(error)});
            return undefined;
        }
    };

    const invokeModule = async (operation: "open" | "focus" | "close", input: TData | string): Promise<boolean> => {
        const host: LaymanModuleHost<TData> | undefined = options.modules;
        if (!host) {
            emit({type: "module-failed", workspaceId: options.workspaceId, operation, message: "module host is not configured"});
            return false;
        }
        try {
            if (operation === "open") await host.open(input as TData);
            else await host[operation](input as string);
            return true;
        } catch (error) {
            emit({type: "module-failed", workspaceId: options.workspaceId, operation, message: message(error)});
            return false;
        }
    };

    return {
        controller: options.controller,
        start() {
            lifecycle = lifecycle.then(async () => {
                if (active) return;
                active = true;
                try {
                    const update = await options.snapshots.load(options.workspaceId);
                    if (update) {
                        if (!validUpdate(update)) throw new Error("update revision and originId are required");
                        const state = deserializeState(update.snapshot) as LaymanState<TData>;
                        workspaceRevision = update.revision;
                        options.controller.replaceState(state, {origin: "restore", requestId: update.originId});
                    }
                    emit({type: "restored", workspaceId: options.workspaceId, revision: workspaceRevision});
                } catch (error) {
                    emit({type: "load-failed", workspaceId: options.workspaceId, message: message(error)});
                }

                stopController = options.controller.subscribe(observe);
                if (!options.snapshots.subscribe) return;
                try {
                    stopPort = await options.snapshots.subscribe(options.workspaceId, (update) => {
                        if (active) receive(update);
                    });
                } catch (error) {
                    emit({type: "subscribe-failed", workspaceId: options.workspaceId, message: message(error)});
                }
            });
            return lifecycle;
        },
        stop() {
            lifecycle = lifecycle.then(async () => {
                if (!active) return;
                active = false;
                stopController?.();
                stopController = undefined;
                try {
                    await stopPort?.();
                } catch (error) {
                    emit({type: "subscribe-failed", workspaceId: options.workspaceId, message: message(error)});
                }
                stopPort = undefined;
                await saves;
            });
            return lifecycle;
        },
        flush: () => saves,
        inspect(): LaymanWorkspaceInspection<TData> {
            const state = options.controller.getState();
            return {
                workspaceId: options.workspaceId,
                revision: workspaceRevision,
                layout: options.controller.inspect(),
                snapshot: serializeState(state),
            };
        },
        dispatch(command: LaymanCommand<TData>, requestId?: string) {
            return options.controller.dispatch(command, {origin: "tauri", requestId});
        },
        replaceState(state: LaymanState<TData>, requestId?: string) {
            return options.controller.replaceState(state, {origin: "tauri", requestId});
        },
        receive,
        openModule: (module) => invokeModule("open", module),
        focusModule: (moduleId) => invokeModule("focus", moduleId),
        closeModule: (moduleId) => invokeModule("close", moduleId),
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
