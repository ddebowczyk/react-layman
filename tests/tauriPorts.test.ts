import {describe, expect, it, vi} from "vitest";
import {createTauriModuleHost, createTauriSnapshotPort} from "../examples/tauri/ports";
import type {TauriInvoke, TauriListen} from "../examples/tauri/ports";
import type {LaymanSnapshotSaveRequest, LaymanWorkspaceUpdate} from "../src/integration";
import type {LaymanSerializedState} from "../src/types";

interface ModuleData {
    kind: string;
    moduleId: string;
}

function update(): LaymanWorkspaceUpdate {
    return {
        revision: 3,
        originId: "desktop",
        snapshot: {schemaVersion: 2, layout: null, floatingWindows: []},
    };
}

describe("Tauri reference ports", () => {
    it("maps snapshot persistence and workspace events to application commands", async () => {
        const workspaceUpdate = update();
        const saved = {status: "saved", update: workspaceUpdate} as const;
        const invoke = vi.fn(async (command: string) =>
            command === "layman_workspace_load" ? workspaceUpdate : saved
        );
        const stop = vi.fn();
        let listener: ((event: {payload: LaymanWorkspaceUpdate}) => void) | undefined;
        const listen = vi.fn(async (_event: string, receive: (event: {payload: LaymanWorkspaceUpdate}) => void) => {
            listener = receive;
            return stop;
        });
        const snapshots = createTauriSnapshotPort(invoke as unknown as TauriInvoke, listen as unknown as TauriListen);
        const request: LaymanSnapshotSaveRequest = {
            expectedRevision: 2,
            originId: workspaceUpdate.originId,
            snapshot: workspaceUpdate.snapshot as LaymanSerializedState,
        };

        expect(await snapshots.load("workspace-main")).toBe(workspaceUpdate);
        expect(await snapshots.compareAndSave("workspace-main", request)).toBe(saved);
        const receive = vi.fn();
        if (!snapshots.subscribe) throw new Error("Tauri snapshot port does not support subscriptions");
        const unsubscribe = await snapshots.subscribe("workspace-main", receive);
        listener?.({payload: workspaceUpdate});

        expect(invoke).toHaveBeenNthCalledWith(1, "layman_workspace_load", {workspaceId: "workspace-main"});
        expect(invoke).toHaveBeenNthCalledWith(2, "layman_workspace_compare_and_save", {workspaceId: "workspace-main", request});
        expect(listen).toHaveBeenCalledWith("layman://workspace/workspace-main", expect.any(Function));
        expect(receive).toHaveBeenCalledWith(workspaceUpdate);
        await unsubscribe();
        expect(stop).toHaveBeenCalledOnce();
    });

    it("maps module lifecycle operations without changing the layout boundary", async () => {
        const invoke = vi.fn(async () => undefined);
        const modules = createTauriModuleHost<ModuleData>(invoke as unknown as TauriInvoke);
        const terminal = {kind: "terminal", moduleId: "shell-1"};

        await modules.open(terminal);
        await modules.focus("shell-1");
        await modules.close("shell-1");

        expect(invoke).toHaveBeenNthCalledWith(1, "module_open", {module: terminal});
        expect(invoke).toHaveBeenNthCalledWith(2, "module_focus", {moduleId: "shell-1"});
        expect(invoke).toHaveBeenNthCalledWith(3, "module_close", {moduleId: "shell-1"});
    });
});
