import type {JsonValue} from "../../src/core";
import type {
    LaymanModuleHost,
    LaymanSnapshotPort,
    LaymanSnapshotSaveResult,
    LaymanWorkspaceUpdate,
} from "../../src/integration";

export type TauriInvoke = <Result>(command: string, args: Record<string, unknown>) => Promise<Result>;
export type TauriListen = <Payload>(event: string, receive: (event: {payload: Payload}) => void) => Promise<() => void>;

/** Maps the app's invoke/listen functions to Layman's framework-neutral ports. */
export function createTauriSnapshotPort(invoke: TauriInvoke, listen: TauriListen): LaymanSnapshotPort {
    return {
        load: (workspaceId) => invoke<LaymanWorkspaceUpdate | undefined>("layman_workspace_load", {workspaceId}),
        compareAndSave: (workspaceId, request) =>
            invoke<LaymanSnapshotSaveResult>("layman_workspace_compare_and_save", {workspaceId, request}),
        subscribe: (workspaceId, receive) =>
            listen<LaymanWorkspaceUpdate>(`layman://workspace/${workspaceId}`, (event) => receive(event.payload)),
    };
}

/** Maps module lifecycle calls to application-owned native window commands. */
export function createTauriModuleHost<TModule extends JsonValue>(invoke: TauriInvoke): LaymanModuleHost<TModule> {
    return {
        open: (module) => invoke<void>("module_open", {module}),
        focus: (moduleId) => invoke<void>("module_focus", {moduleId}),
        close: (moduleId) => invoke<void>("module_close", {moduleId}),
    };
}
