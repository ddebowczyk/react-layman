import {useEffect, useMemo, useRef} from "react";
import type {JsonValue, LaymanState} from "../../src/core";
import {createLaymanController} from "../../src/controller";
import {createLaymanWorkspaceBridge} from "../../src/integration";
import type {LaymanModuleHost, LaymanSnapshotPort, LaymanWorkspaceBridge} from "../../src/integration";

export interface UseTauriWorkspaceOptions<TData extends JsonValue> {
    workspaceId: string;
    originId: string;
    initialState: LaymanState<TData>;
    snapshots: LaymanSnapshotPort;
    modules: LaymanModuleHost<TData>;
}

/**
 * Starts one controller bridge for a mounted Tauri React view. Remount to use
 * a different workspace, origin, persistence port, or module host.
 */
export function useTauriWorkspace<TData extends JsonValue>(
    options: UseTauriWorkspaceOptions<TData>
): LaymanWorkspaceBridge<TData> {
    const controllerRef = useRef<ReturnType<typeof createLaymanController<TData>> | null>(null);
    if (!controllerRef.current) controllerRef.current = createLaymanController({state: options.initialState});
    const controller = controllerRef.current;
    const bridge = useMemo(
        () =>
            createLaymanWorkspaceBridge({
                workspaceId: options.workspaceId,
                originId: options.originId,
                controller,
                snapshots: options.snapshots,
                modules: options.modules,
            }),
        [controller, options.modules, options.originId, options.snapshots, options.workspaceId]
    );

    useEffect(() => {
        void bridge.start();
        return () => {
            void bridge.stop();
        };
    }, [bridge]);

    return bridge;
}
