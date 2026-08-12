import {describe, expect, it, vi} from "vitest";
import {createLaymanController} from "../src/controller";
import type {LaymanState} from "../src/core";
import {tab, window} from "./helpers";

function workspace(): LaymanState<{path: string}> {
    return {
        layout: window("window-main", tab("Editor", {path: "/editor"}, "tab-editor"), tab("Terminal", {path: "/terminal"}, "tab-terminal")),
        floatingWindows: [],
    };
}

describe("Layman controller", () => {
    it("applies host commands, records provenance, and notifies observers", () => {
        const onStateChange = vi.fn();
        const onTransition = vi.fn();
        const controller = createLaymanController({state: workspace(), onStateChange, onTransition});
        const listener = vi.fn();
        const stop = controller.subscribe(listener);

        const transition = controller.dispatch(
            {type: "tab.select", tabId: "tab-terminal"},
            {origin: "tauri", requestId: "invoke-7"}
        );

        expect(transition).toMatchObject({status: "applied", revision: 1, meta: {origin: "tauri", requestId: "invoke-7"}});
        expect(controller.getState().layout).toMatchObject({selectedTabId: "tab-terminal"});
        expect(onStateChange).toHaveBeenCalledWith(transition.next, transition);
        expect(onTransition).toHaveBeenCalledWith(transition);
        expect(listener).toHaveBeenCalledWith(transition);

        stop();
        controller.dispatch({type: "tab.select", tabId: "tab-terminal"});
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("rejects forbidden commands without changing state or revision", () => {
        const controller = createLaymanController({state: workspace()});
        const before = controller.getState();

        const transition = controller.dispatch(
            {type: "tab.select", tabId: "tab-editor"},
            {origin: "user", allowed: false}
        );

        expect(transition).toMatchObject({status: "rejected", reason: "forbidden", revision: 0});
        expect(transition.next).toBe(before);
        expect(controller.getState()).toBe(before);
    });

    it("replaces only valid state and exposes detached inspection", () => {
        const controller = createLaymanController({state: workspace()});
        const invalid = {
            layout: {...workspace().layout!, selectedTabId: null},
            floatingWindows: [],
        };

        const rejected = controller.replaceState(invalid, {origin: "restore"});
        expect(rejected).toMatchObject({kind: "state.replace", status: "rejected", reason: "invalid-state", revision: 0});

        const replacement: LaymanState<{path: string}> = {layout: undefined, floatingWindows: []};
        const applied = controller.replaceState(replacement, {origin: "restore"});
        expect(applied).toMatchObject({kind: "state.replace", status: "applied", revision: 1, meta: {origin: "restore"}});
        expect(controller.getState()).toBe(replacement);

        const inspection = controller.inspect();
        expect(inspection).toEqual({rootId: null, windows: [], splits: []});
        expect(inspection).not.toBe(controller.inspect());
    });

    it("rejects invalid setup state", () => {
        const invalid: LaymanState<{path: string}> = {
            layout: {...workspace().layout!, selectedTabId: null},
            floatingWindows: [],
        };
        expect(() => createLaymanController({state: invalid})).toThrow("controller state is invalid");
    });
});
