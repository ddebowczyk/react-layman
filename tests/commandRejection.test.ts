import {describe, expect, it} from "vitest";
import {applyLaymanCommand} from "../src/core";
import type {LaymanState} from "../src/types";
import {floatingWindow, node, tab, window} from "./helpers";

function workspace(): LaymanState {
    return {
        layout: node(
            "split-main",
            "row",
            window("window-left", tab("Left", {path: "/left"}, "tab-left")),
            window("window-right", tab("Right", {path: "/right"}, "tab-right"))
        ),
        floatingWindows: [floatingWindow("window-floating", tab("Floating", {path: "/floating"}, "tab-floating"))],
    };
}

describe("stable command rejection invariants", () => {
    it("rejects missing tab and window identities without changing selected state", () => {
        const state = workspace();
        const commands = [
            {type: "tab.select", tabId: "tab-missing"} as const,
            {type: "tab.remove", tabId: "tab-missing"} as const,
            {type: "window.close", windowId: "window-missing"} as const,
            {type: "floating.focus", windowId: "window-missing"} as const,
        ];

        for (const command of commands) {
            const transition = applyLaymanCommand(state, command);

            expect(transition.status).toBe("rejected");
            expect(transition.next).toBe(state);
            expect(transition.changes).toEqual([]);
        }
        expect((state.layout as {children: readonly {selectedTabId: string | null}[]}).children.map((item) => item.selectedTabId)).toEqual([
            "tab-left",
            "tab-right",
        ]);
        expect(state.floatingWindows[0]?.selectedTabId).toBe("tab-floating");
    });

    it("validates a tab target before removing the source tab", () => {
        const state = workspace();
        const transition = applyLaymanCommand(state, {
            type: "tab.move",
            tabId: "tab-left",
            target: {kind: "window", windowId: "window-missing"},
            placement: "center",
        });

        expect(transition).toMatchObject({status: "rejected", reason: "invalid-target"});
        expect(transition.next).toBe(state);
        expect((state.layout as {children: readonly {tabs: readonly {id: string}[]}[]}).children[0]?.tabs.map((tab) => tab.id)).toEqual(["tab-left"]);
    });

    it("validates a window target before removing the source window", () => {
        const state = workspace();
        const transition = applyLaymanCommand(state, {
            type: "window.move",
            windowId: "window-left",
            target: {kind: "window", windowId: "window-missing"},
            placement: "right",
        });

        expect(transition).toMatchObject({status: "rejected", reason: "invalid-target"});
        expect(transition.next).toBe(state);
        expect((state.layout as {children: readonly {id: string}[]}).children.map((item) => item.id)).toEqual(["window-left", "window-right"]);
    });

    it("makes a center move onto the source window an identity-preserving no-op", () => {
        const state = workspace();
        const transition = applyLaymanCommand(state, {
            type: "tab.move",
            tabId: "tab-left",
            target: {kind: "window", windowId: "window-left"},
            placement: "center",
        });

        expect(transition).toMatchObject({status: "noop", changes: []});
        expect(transition.next).toBe(state);
    });
});
