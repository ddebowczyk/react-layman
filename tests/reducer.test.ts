import {describe, expect, it} from "vitest";
import {applyLaymanCommand, validateLaymanState} from "../src/core";
import type {LaymanNode, LaymanState, LaymanWindow} from "../src/types";
import {floatingWindow, node, tab, window} from "./helpers";

function twoWindowState(): LaymanState {
    return {
        layout: node(
            "split-main",
            "row",
            {...window("window-left", tab("Left", {}, "tab-left"), tab("Editor", {}, "tab-editor")), viewPercent: 40},
            {...window("window-right", tab("Right", {}, "tab-right")), viewPercent: 60}
        ),
        floatingWindows: [],
    };
}

describe("semantic layout commands", () => {
    it("creates the first tiled window from an explicit root target", () => {
        const state: LaymanState = {layout: undefined, floatingWindows: []};
        const editor = tab("Editor", {path: "/editor"}, "tab-editor");

        const transition = applyLaymanCommand(state, {
            type: "tab.insert",
            tab: editor,
            target: {kind: "root"},
            placement: "center",
            windowId: "window-main",
        });

        expect(transition.status).toBe("applied");
        expect(transition.changes).toContainEqual({kind: "window", id: "window-main"});
        expect(transition.next.layout).toEqual(window("window-main", editor));
        expect(state.layout).toBeUndefined();
    });

    it("moves a tab by stable IDs and retains the same tab value", () => {
        const state = twoWindowState();
        const tabToMove = (state.layout as LaymanNode).children[0] as LaymanWindow;
        const editor = tabToMove.tabs[1];

        const transition = applyLaymanCommand(state, {
            type: "tab.move",
            tabId: editor.id,
            target: {kind: "window", windowId: "window-right"},
            placement: "center",
        });

        const layout = transition.next.layout as LaymanNode;
        expect(transition.status).toBe("applied");
        expect((layout.children[0] as LaymanWindow).tabs.map((candidate) => candidate.id)).toEqual(["tab-left"]);
        expect((layout.children[1] as LaymanWindow).tabs[1]).toBe(editor);
        expect((state.layout as LaymanNode).children[0]).toBe(tabToMove);
    });

    it("adds an edge split with stable window and split IDs", () => {
        const first = tab("First", {}, "tab-first");
        const second = tab("Second", {}, "tab-second");
        const state: LaymanState = {layout: window("window-main", first, second), floatingWindows: []};

        const transition = applyLaymanCommand(state, {
            type: "tab.move",
            tabId: second.id,
            target: {kind: "window", windowId: "window-main"},
            placement: "right",
            windowId: "window-preview",
        });

        const layout = transition.next.layout as LaymanNode;
        expect(transition.status).toBe("applied");
        expect(layout).toMatchObject({id: "split-window-preview-window-main", direction: "row"});
        expect(layout.children.map((child) => child.id)).toEqual(["window-main", "window-preview"]);
        expect((layout.children[1] as LaymanWindow).tabs).toEqual([second]);
    });

    it("rejects an invalid target atomically", () => {
        const state = twoWindowState();
        const transition = applyLaymanCommand(state, {
            type: "tab.move",
            tabId: "tab-editor",
            target: {kind: "window", windowId: "window-missing"},
            placement: "center",
        });

        expect(transition).toMatchObject({status: "rejected", reason: "invalid-target"});
        expect(transition.previous).toBe(state);
        expect(transition.next).toBe(state);
    });

    it("rejects malformed inserted tabs without changing state", () => {
        const state: LaymanState = {layout: undefined, floatingWindows: []};
        const transition = applyLaymanCommand(state, {
            type: "tab.insert",
            tab: {id: "tab-invalid", title: "Invalid", data: new Date() as never},
            target: {kind: "root"},
            placement: "center",
        });

        expect(transition).toMatchObject({status: "rejected", reason: "invalid-tab"});
        expect(transition.next).toBe(state);
    });

    it("rejects an explicit window ID already held by a split", () => {
        const state = twoWindowState();
        const transition = applyLaymanCommand(state, {
            type: "tab.insert",
            tab: tab("Preview", {}, "tab-preview"),
            target: {kind: "root"},
            placement: "right",
            windowId: "split-main",
        });

        expect(transition).toMatchObject({status: "rejected", reason: "duplicate-id"});
        expect(transition.next).toBe(state);
    });

    it("selects and removes tabs without leaving an invalid selection", () => {
        const state = twoWindowState();
        const selected = applyLaymanCommand(state, {type: "tab.select", tabId: "tab-editor"});
        const removed = applyLaymanCommand(selected.next, {type: "tab.remove", tabId: "tab-editor"});

        expect(((selected.next.layout as LaymanNode).children[0] as LaymanWindow).selectedTabId).toBe("tab-editor");
        expect(((removed.next.layout as LaymanNode).children[0] as LaymanWindow)).toMatchObject({
            tabs: [{id: "tab-left"}],
            selectedTabId: "tab-left",
        });
    });

    it("floats and docks a window without reconstructing its tabs", () => {
        const state = twoWindowState();
        const leftWindow = (state.layout as LaymanNode).children[0] as LaymanWindow;
        const floated = applyLaymanCommand(state, {
            type: "window.move",
            windowId: "window-left",
            target: {kind: "floating", position: {top: 10, left: 20, width: 300, height: 200}},
            placement: "center",
        });

        expect(floated.status).toBe("applied");
        expect(floated.next.floatingWindows[0].tabs).toBe(leftWindow.tabs);
        expect((floated.next.layout as LaymanWindow).id).toBe("window-right");

        const docked = applyLaymanCommand(floated.next, {
            type: "window.move",
            windowId: "window-left",
            target: {kind: "window", windowId: "window-right"},
            placement: "center",
        });

        expect(docked.status).toBe("applied");
        expect(docked.next.floatingWindows).toEqual([]);
        expect((docked.next.layout as LaymanWindow).tabs).toEqual([...((state.layout as LaymanNode).children[1] as LaymanWindow).tabs, ...leftWindow.tabs]);
    });

    it("rejects invalid floating geometry atomically", () => {
        const state: LaymanState = {layout: undefined, floatingWindows: [floatingWindow("window-float", tab("Float", {}, "tab-float"))]};
        const transition = applyLaymanCommand(state, {
            type: "floating.position",
            windowId: "window-float",
            position: {top: Infinity, left: 0, width: 200, height: 100},
        });

        expect(transition).toMatchObject({status: "rejected", reason: "invalid-position"});
        expect(transition.next).toBe(state);
    });

    it("focuses and closes floating windows through explicit commands", () => {
        const state: LaymanState = {
            layout: undefined,
            floatingWindows: [
                {...floatingWindow("window-back", tab("Back", {}, "tab-back")), zIndex: 30},
                {...floatingWindow("window-front", tab("Front", {}, "tab-front")), zIndex: 31},
            ],
        };
        const focused = applyLaymanCommand(state, {type: "floating.focus", windowId: "window-back"});
        const closed = applyLaymanCommand(focused.next, {type: "window.close", windowId: "window-front"});

        expect(focused.next.floatingWindows.find((candidate) => candidate.id === "window-back")?.zIndex).toBe(32);
        expect(closed.next.floatingWindows.map((candidate) => candidate.id)).toEqual(["window-back"]);
    });

    it("resizes a stable split and reports invalid dimensions", () => {
        const state = twoWindowState();
        const resized = applyLaymanCommand(state, {type: "split.resize", splitId: "split-main", index: 0, leadingPercent: 30});
        const layout = resized.next.layout as LaymanNode;

        expect(resized.status).toBe("applied");
        expect(layout.children.map((child) => child.viewPercent)).toEqual([30, 70]);

        const invalid = applyLaymanCommand(resized.next, {type: "split.resize", splitId: "split-main", index: 0, leadingPercent: 100});
        expect(invalid).toMatchObject({status: "rejected", reason: "invalid-size"});
        expect(invalid.next).toBe(resized.next);
    });

    it("normalizes split proportions only once", () => {
        const state = twoWindowState();
        const arranged = applyLaymanCommand(state, {type: "layout.autoArrange"});
        const repeat = applyLaymanCommand(arranged.next, {type: "layout.autoArrange"});

        expect((arranged.next.layout as LaymanNode).children.map((child) => child.viewPercent)).toEqual([50, 50]);
        expect(repeat.status).toBe("noop");
        expect(repeat.next).toBe(arranged.next);
    });

    it("rejects an invalid layout before it runs a command", () => {
        const duplicated: LaymanState = {
            layout: node("window-shared", "row", window("window-shared", tab("Left", {}, "tab-left")), window("window-right", tab("Right", {}, "tab-right"))),
            floatingWindows: [],
        };
        expect(validateLaymanState(duplicated)).toMatchObject({valid: false, issues: ["duplicate-layout-id"]});

        const transition = applyLaymanCommand(duplicated, {type: "layout.autoArrange"});
        expect(transition).toMatchObject({status: "rejected", reason: "invalid-state"});
        expect(transition.next).toBe(duplicated);
    });
});
