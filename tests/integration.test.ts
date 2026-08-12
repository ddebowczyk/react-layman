import {describe, expect, it, vi} from "vitest";
import {createLaymanController} from "../src/controller";
import {createLaymanWorkspaceBridge} from "../src/integration";
import {serializeState} from "../src/layoutSnapshot";
import type {
    LaymanSnapshotPort,
    LaymanSnapshotSaveRequest,
    LaymanSnapshotSaveResult,
    LaymanWorkspaceUpdate,
} from "../src/integration";
import type {LaymanState} from "../src/core";
import {floatingWindow, tab, window} from "./helpers";

interface ModuleData {
    moduleId: string;
}

function workspace(moduleId = "editor"): LaymanState<ModuleData> {
    return {
        layout: window("window-main", tab("Editor", {moduleId}, "tab-editor")),
        floatingWindows: [],
    };
}

function update(state: LaymanState, revision: number, originId = "remote"): LaymanWorkspaceUpdate {
    return {revision, originId, snapshot: serializeState(state)};
}

function snapshotPort(initial?: LaymanWorkspaceUpdate): LaymanSnapshotPort & {
    requests: LaymanSnapshotSaveRequest[];
    saves: LaymanWorkspaceUpdate[];
    publish(update: LaymanWorkspaceUpdate): void;
} {
    let receive: ((update: LaymanWorkspaceUpdate) => void) | undefined;
    const requests: LaymanSnapshotSaveRequest[] = [];
    const saves: LaymanWorkspaceUpdate[] = [];
    return {
        requests,
        saves,
        load: vi.fn(async () => initial),
        compareAndSave: vi.fn(async (_workspaceId, request) => {
            requests.push(request);
            const next = {
                revision: request.expectedRevision + 1,
                originId: request.originId,
                snapshot: request.snapshot,
            };
            saves.push(next);
            return {status: "saved", update: next} as const;
        }),
        subscribe: vi.fn((_workspaceId, next) => {
            receive = next;
            return () => {
                receive = undefined;
            };
        }),
        publish(next) {
            receive?.(next);
        },
    };
}

describe("Layman workspace bridge", () => {
    it("restores a versioned snapshot and retains the default state after a corrupt load", async () => {
        const restored = workspace("restored");
        const port = snapshotPort(update(restored, 4));
        const controller = createLaymanController({state: workspace()});
        const bridge = createLaymanWorkspaceBridge({workspaceId: "main", originId: "view-a", controller, snapshots: port});

        await bridge.start();

        expect(bridge.inspect()).toMatchObject({workspaceId: "main", revision: 4});
        expect(controller.inspect().windows[0]?.tabs[0]?.data).toEqual({moduleId: "restored"});
        expect(port.saves).toEqual([]);

        const events: string[] = [];
        const corruptController = createLaymanController({state: workspace("fallback")});
        const corruptBridge = createLaymanWorkspaceBridge({
            workspaceId: "corrupt",
            originId: "view-b",
            controller: corruptController,
            snapshots: snapshotPort({revision: 1, originId: "remote", snapshot: {invalid: true}}),
            onEvent: (event) => events.push(event.type),
        });
        await corruptBridge.start();

        expect(events).toContain("load-failed");
        expect(corruptController.inspect().windows[0]?.tabs[0]?.data).toEqual({moduleId: "fallback"});
    });

    it("persists only applied transitions in local revision order", async () => {
        const port = snapshotPort();
        const controller = createLaymanController({state: workspace()});
        const bridge = createLaymanWorkspaceBridge({workspaceId: "main", originId: "view-a", controller, snapshots: port});
        await bridge.start();

        expect(bridge.dispatch({type: "tab.select", tabId: "tab-editor"})).toMatchObject({status: "noop"});
        expect(
            bridge.dispatch({
                type: "tab.insert",
                tab: {id: "tab-terminal", title: "Terminal", data: {moduleId: "terminal"}},
                target: {kind: "window", windowId: "window-main"},
                placement: "center",
            })
        ).toMatchObject({status: "applied"});
        expect(controller.dispatch({type: "tab.select", tabId: "tab-terminal"}, {origin: "user"})).toMatchObject({status: "applied"});
        await bridge.flush();

        expect(port.requests.map((entry) => entry.expectedRevision)).toEqual([0, 1]);
        expect(port.saves.map((entry) => entry.revision)).toEqual([1, 2]);
        expect(port.saves.every((entry) => entry.originId === "view-a")).toBe(true);
        expect(port.saves[1]?.snapshot).toMatchObject({schemaVersion: 2});
    });

    it("adopts the host record after a compare-and-save conflict without saving stale local work", async () => {
        const port = snapshotPort();
        const events: string[] = [];
        port.compareAndSave = vi.fn(async () => ({
            status: "conflict",
            current: update(workspace("remote"), 2, "view-b"),
        }));
        const controller = createLaymanController({state: workspace()});
        const bridge = createLaymanWorkspaceBridge({
            workspaceId: "main",
            originId: "view-a",
            controller,
            snapshots: port,
            onEvent: (event) => events.push(event.type),
        });
        await bridge.start();

        bridge.dispatch({
            type: "tab.insert",
            tab: {id: "tab-terminal", title: "Terminal", data: {moduleId: "terminal"}},
            target: {kind: "window", windowId: "window-main"},
            placement: "center",
        });
        bridge.dispatch({type: "tab.select", tabId: "tab-terminal"});
        await bridge.flush();

        expect(port.compareAndSave).toHaveBeenCalledOnce();
        expect(port.compareAndSave).toHaveBeenCalledWith(
            "main",
            expect.objectContaining({expectedRevision: 0, originId: "view-a"})
        );
        expect(bridge.inspect().revision).toBe(2);
        expect(controller.inspect().windows[0]?.tabs[0]?.data).toEqual({moduleId: "remote"});
        expect(events).toContain("save-conflicted");
        expect(events).not.toContain("save-failed");
    });

    it("retains a newer subscription record while an older compare-and-save response is pending", async () => {
        const port = snapshotPort();
        let resolveSave: ((result: LaymanSnapshotSaveResult) => void) | undefined;
        port.compareAndSave = vi.fn(
            () => new Promise<LaymanSnapshotSaveResult>((resolve) => {
                resolveSave = resolve;
            })
        );
        const controller = createLaymanController({state: workspace()});
        const bridge = createLaymanWorkspaceBridge({workspaceId: "main", originId: "view-a", controller, snapshots: port});
        await bridge.start();

        bridge.dispatch({
            type: "tab.insert",
            tab: {id: "tab-terminal", title: "Terminal", data: {moduleId: "terminal"}},
            target: {kind: "window", windowId: "window-main"},
            placement: "center",
        });
        await Promise.resolve();
        expect(port.compareAndSave).toHaveBeenCalledOnce();

        port.publish(update(workspace("remote"), 2, "view-b"));
        if (!resolveSave) throw new Error("compareAndSave did not start");
        resolveSave({status: "saved", update: update(workspace("local"), 1, "view-a")});
        await bridge.flush();

        expect(bridge.inspect().revision).toBe(2);
        expect(controller.inspect().windows[0]?.tabs[0]?.data).toEqual({moduleId: "remote"});
    });

    it("ignores echoed and stale updates, then applies a newer external update without saving it again", async () => {
        const port = snapshotPort(update(workspace(), 2));
        const events: string[] = [];
        const controller = createLaymanController({state: workspace("fallback")});
        const bridge = createLaymanWorkspaceBridge({
            workspaceId: "main",
            originId: "view-a",
            controller,
            snapshots: port,
            onEvent: (event) => events.push(event.type),
        });
        await bridge.start();

        port.publish(update(workspace("echo"), 3, "view-a"));
        port.publish(update(workspace("stale"), 2, "other"));
        port.publish(update(workspace("remote"), 3, "other"));
        await bridge.flush();

        expect(controller.inspect().windows[0]?.tabs[0]?.data).toEqual({moduleId: "remote"});
        expect(bridge.inspect().revision).toBe(3);
        expect(port.saves).toEqual([]);
        expect(events.filter((event) => event === "external-update-ignored")).toHaveLength(2);
        expect(events).toContain("external-update-applied");
    });

    it("routes native commands through the controller and reports module failures without mutating layout", async () => {
        const state: LaymanState<ModuleData> = {
            layout: window("window-main", tab("Editor", {moduleId: "editor"}, "tab-editor")),
            floatingWindows: [floatingWindow("window-floating", tab("Terminal", {moduleId: "terminal"}, "tab-terminal"))],
        };
        const port = snapshotPort();
        const events: string[] = [];
        const controller = createLaymanController({state});
        const bridge = createLaymanWorkspaceBridge({
            workspaceId: "main",
            originId: "view-a",
            controller,
            snapshots: port,
            modules: {
                open: async () => {
                    throw new Error("native launch failed");
                },
                focus: async () => undefined,
                close: async () => undefined,
            },
            onEvent: (event) => events.push(event.type),
        });
        await bridge.start();

        expect(bridge.dispatch({type: "window.close", windowId: "window-main"}, "native-close")).toMatchObject({
            status: "applied",
            meta: {origin: "tauri", requestId: "native-close"},
        });
        const beforeModuleFailure = bridge.inspect().snapshot;
        expect(await bridge.openModule({moduleId: "new-module"})).toBe(false);
        await bridge.flush();

        expect(bridge.inspect().snapshot).toEqual(beforeModuleFailure);
        expect(events).toContain("module-failed");
        expect(port.saves).toHaveLength(1);
    });

    it("keeps workspace subscriptions independent", async () => {
        const leftPort = snapshotPort();
        const rightPort = snapshotPort();
        const leftController = createLaymanController({state: workspace("left")});
        const rightController = createLaymanController({state: workspace("right")});
        const left = createLaymanWorkspaceBridge({workspaceId: "left", originId: "left-view", controller: leftController, snapshots: leftPort});
        const right = createLaymanWorkspaceBridge({workspaceId: "right", originId: "right-view", controller: rightController, snapshots: rightPort});
        await Promise.all([left.start(), right.start()]);

        leftPort.publish(update(workspace("left-updated"), 1, "desktop"));

        expect(leftController.inspect().windows[0]?.tabs[0]?.data).toEqual({moduleId: "left-updated"});
        expect(rightController.inspect().windows[0]?.tabs[0]?.data).toEqual({moduleId: "right"});
    });

    it("reports persistence and subscription failures without discarding state", async () => {
        const port = snapshotPort();
        port.compareAndSave = vi.fn(async () => {
            throw new Error("disk is unavailable");
        });
        port.subscribe = vi.fn(() => {
            throw new Error("event transport is unavailable");
        });
        const events: string[] = [];
        const controller = createLaymanController({state: workspace()});
        const bridge = createLaymanWorkspaceBridge({
            workspaceId: "main",
            originId: "view-a",
            controller,
            snapshots: port,
            onEvent: (event) => events.push(event.type),
        });
        await bridge.start();
        bridge.dispatch({
            type: "tab.insert",
            tab: {id: "tab-terminal", title: "Terminal", data: {moduleId: "terminal"}},
            target: {kind: "window", windowId: "window-main"},
            placement: "center",
        });
        await bridge.flush();

        expect(events).toContain("subscribe-failed");
        expect(events).toContain("save-failed");
        expect(controller.inspect().windows[0]?.tabs.map((item) => item.id)).toEqual(["tab-editor", "tab-terminal"]);
    });

    it("serializes start-stop-start lifecycle calls without duplicate observers", async () => {
        const port = snapshotPort();
        const unsubscribe = vi.fn();
        port.subscribe = vi.fn(() => unsubscribe);
        const controller = createLaymanController({state: workspace()});
        const bridge = createLaymanWorkspaceBridge({workspaceId: "main", originId: "view-a", controller, snapshots: port});

        const firstStart = bridge.start();
        const stop = bridge.stop();
        const restart = bridge.start();
        await Promise.all([firstStart, stop, restart]);

        bridge.dispatch({
            type: "tab.insert",
            tab: {id: "tab-terminal", title: "Terminal", data: {moduleId: "terminal"}},
            target: {kind: "window", windowId: "window-main"},
            placement: "center",
        });
        await bridge.flush();

        expect(port.subscribe).toHaveBeenCalledTimes(2);
        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(port.saves).toHaveLength(1);
    });
});
