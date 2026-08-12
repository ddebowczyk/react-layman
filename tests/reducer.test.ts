import {describe, expect, it} from "vitest";
import {LaymanReducer} from "../src/LaymanReducer";
import type {FloatingWindowData, LaymanLayout, LaymanLayoutAction, LaymanNode, LaymanState, LaymanTab, LaymanWindow} from "../src/types";
import {floatingWindow, tab, window} from "./helpers";

function makeWindow(...tabs: LaymanTab[]): LaymanWindow {
    return window("window-root", ...tabs);
}

function makeRowOfTwo(left = tab("Left", {}, "tab-left"), right = tab("Right", {}, "tab-right")): LaymanNode {
    return {
        direction: "row",
        children: [
            {...window("window-left", left), viewPercent: 50},
            {...window("window-right", right), viewPercent: 50},
        ],
    };
}

function run(state: LaymanState, action: LaymanLayoutAction): LaymanState {
    return LaymanReducer(state, action);
}

function runLayout(layout: LaymanLayout, action: LaymanLayoutAction): LaymanLayout {
    return run({layout, floatingWindows: []}, action).layout;
}

describe("addTab", () => {
    it("adds to root, nested, and floating windows", () => {
        const root = makeWindow(tab("Existing", {}, "tab-existing"));
        const added = tab("Added", {}, "tab-added");
        expect((runLayout(root, {type: "addTab", path: [], tab: added}) as LaymanWindow).tabs).toEqual([...root.tabs, added]);

        const layout = makeRowOfTwo();
        expect(((runLayout(layout, {type: "addTab", path: [1], tab: added}) as LaymanNode).children[1] as LaymanWindow).tabs).toContain(added);

        const floating = floatingWindow("float-1", tab("Float", {}, "tab-float"));
        const result = run({layout: undefined, floatingWindows: [floating]}, {type: "addTab", path: {floatingId: "float-1"}, tab: added});
        expect(result.floatingWindows[0].tabs).toEqual([...floating.tabs, added]);
    });

    it("creates a new root window when the layout is empty", () => {
        const added = tab("Added", {}, "tab-added");
        const result = runLayout(undefined, {type: "addTab", path: [], tab: added}) as LaymanWindow;
        expect(result).toMatchObject({tabs: [added], selectedTabId: added.id});
        expect(result.id).toEqual(expect.any(String));
    });
});

describe("removeTab and selectTab", () => {
    it("keeps selection by tab ID and chooses the adjacent tab when removing the selection", () => {
        const a = tab("A", {}, "tab-a");
        const b = tab("B", {}, "tab-b");
        const c = tab("C", {}, "tab-c");
        const layout: LaymanWindow = {...window("window-root", a, b, c), selectedTabId: b.id};
        const result = runLayout(layout, {type: "removeTab", path: [], tab: b}) as LaymanWindow;
        expect(result.tabs).toEqual([a, c]);
        expect(result.selectedTabId).toBe(c.id);
    });

    it("does not change selection when removing a different tab", () => {
        const a = tab("A", {}, "tab-a");
        const b = tab("B", {}, "tab-b");
        const c = tab("C", {}, "tab-c");
        const layout: LaymanWindow = {...window("window-root", a, b, c), selectedTabId: c.id};
        const result = runLayout(layout, {type: "removeTab", path: [], tab: a}) as LaymanWindow;
        expect(result.selectedTabId).toBe(c.id);
    });

    it("removes emptied windows and selects only tabs that belong to their window", () => {
        const left = tab("Left", {}, "tab-left");
        const right = tab("Right", {}, "tab-right");
        expect(runLayout(makeRowOfTwo(left, right), {type: "removeTab", path: [0], tab: left})).toMatchObject({tabs: [right]});
        expect(runLayout(makeWindow(left), {type: "removeTab", path: [], tab: left})).toBeUndefined();

        const layout = makeWindow(left);
        expect(runLayout(layout, {type: "selectTab", path: [], tab: right})).toBe(layout);
    });

    it("closes an emptied floating window", () => {
        const only = tab("Only", {}, "tab-only");
        const result = run({layout: undefined, floatingWindows: [floatingWindow("float-1", only)]}, {
            type: "removeTab",
            path: {floatingId: "float-1"},
            tab: only,
        });
        expect(result.floatingWindows).toEqual([]);
    });
});

describe("moveTab", () => {
    it("moves tabs between windows without recreating them", () => {
        const leftA = tab("Left A", {}, "tab-left-a");
        const leftB = tab("Left B", {}, "tab-left-b");
        const right = tab("Right", {}, "tab-right");
        const layout: LaymanNode = {
            direction: "row",
            children: [
                {...window("window-left", leftA, leftB), viewPercent: 50},
                {...window("window-right", right), viewPercent: 50},
            ],
        };
        const result = runLayout(layout, {type: "moveTab", path: [0], newPath: [1], tab: leftB, placement: "center"}) as LaymanNode;
        expect((result.children[0] as LaymanWindow).tabs).toEqual([leftA]);
        expect((result.children[1] as LaymanWindow).tabs).toEqual([right, leftB]);
        expect((result.children[1] as LaymanWindow).tabs[1]).toBe(leftB);
    });

    it("creates a split window for an edge destination", () => {
        const a = tab("A", {}, "tab-a");
        const b = tab("B", {}, "tab-b");
        const result = runLayout(makeWindow(a, b), {type: "moveTab", path: [], newPath: [], tab: b, placement: "right"}) as LaymanNode;
        expect(result.direction).toBe("row");
        expect((result.children[0] as LaymanWindow).tabs).toEqual([a]);
        expect((result.children[1] as LaymanWindow).tabs).toEqual([b]);
    });

    it("keeps external tabs external and supports existing floating destinations", () => {
        const existing = tab("Existing", {}, "tab-existing");
        const external = tab("External", {}, "tab-external");
        const layout = makeWindow(existing);
        expect((runLayout(layout, {type: "moveTab", path: [-1], newPath: [], tab: external, placement: "center"}) as LaymanWindow).tabs).toEqual([
            existing,
            external,
        ]);

        const floating = floatingWindow("float-1", tab("Float", {}, "tab-float"));
        const result = run({layout, floatingWindows: [floating]}, {
            type: "moveTab",
            path: [],
            newPath: {floatingId: "float-1"},
            tab: existing,
            placement: "center",
        });
        expect(result.floatingWindows[0].tabs).toEqual([floating.tabs[0], existing]);
    });

    it("rejects invalid destinations before it removes the source tab", () => {
        const left = tab("Left", {}, "tab-left");
        const state: LaymanState = {layout: makeRowOfTwo(left), floatingWindows: []};
        expect(run(state, {type: "moveTab", path: [0], newPath: [9], tab: left, placement: "center"})).toBe(state);
        expect(
            run(state, {type: "moveTab", path: [0], newPath: {floatingId: "missing"}, tab: left, placement: "center"})
        ).toBe(state);
    });

    it("does not mutate a tab when it is dropped back into the same window", () => {
        const selected = tab("Selected", {}, "tab-selected");
        const state: LaymanState = {layout: {...makeWindow(selected), selectedTabId: selected.id}, floatingWindows: []};
        expect(run(state, {type: "moveTab", path: [], newPath: [], tab: selected, placement: "center"})).toBe(state);
    });
});

describe("window placement and movement", () => {
    it("adds windows at root edges and keeps IDs", () => {
        const root = makeWindow(tab("Root", {}, "tab-root"));
        const added = window("window-added", tab("Added", {}, "tab-added"));
        const result = runLayout(root, {type: "addWindow", path: [], window: added, placement: "left"}) as LaymanNode;
        expect(result.direction).toBe("row");
        expect((result.children[0] as LaymanWindow).id).toBe("window-added");
        expect((result.children[1] as LaymanWindow).id).toBe("window-root");
    });

    it("extends a matching root split and rescales its children", () => {
        const layout = makeRowOfTwo();
        const added = window("window-added", tab("Added", {}, "tab-added"));
        const result = runLayout(layout, {type: "addWindow", path: [], window: added, placement: "right"}) as LaymanNode;
        expect(result.children).toHaveLength(3);
        expect((result.children[2] as LaymanWindow).id).toBe("window-added");
        expect(result.children.reduce((sum, child) => sum + (child?.viewPercent ?? 0), 0)).toBeCloseTo(100);
    });

    it("floats, docks, and merges source windows from their actual state", () => {
        const left = tab("Left", {}, "tab-left");
        const right = tab("Right", {}, "tab-right");
        const state: LaymanState = {layout: makeRowOfTwo(left, right), floatingWindows: []};
        const floated = run(state, {
            type: "moveWindow",
            path: [0],
            newPath: {floatingId: "float-left"},
            placement: "center",
            position: {top: 5, left: 5, width: 250, height: 150},
        });
        expect(floated.floatingWindows[0]).toMatchObject({id: "window-left", tabs: [left]});
        expect((floated.layout as LaymanWindow).tabs).toEqual([right]);

        const docked = run(floated, {type: "moveWindow", path: {floatingId: "window-left"}, newPath: [], placement: "center"});
        expect(docked.floatingWindows).toEqual([]);
        expect((docked.layout as LaymanWindow).tabs).toEqual([right, left]);

        const one = floatingWindow("float-one", tab("One", {}, "tab-one"));
        const two = floatingWindow("float-two", tab("Two", {}, "tab-two"));
        const merged = run({layout: undefined, floatingWindows: [one, two]}, {
            type: "moveWindow",
            path: {floatingId: "float-one"},
            newPath: {floatingId: "float-two"},
            placement: "center",
        });
        expect(merged.floatingWindows).toHaveLength(1);
        expect(merged.floatingWindows[0].tabs).toEqual([two.tabs[0], one.tabs[0]]);
    });

    it("does not remove a window when a requested float lacks its position", () => {
        const layout = makeWindow(tab("Only", {}, "tab-only"));
        const state: LaymanState = {layout, floatingWindows: []};
        expect(run(state, {type: "moveWindow", path: [], newPath: {floatingId: "float"}, placement: "center"})).toBe(state);
    });

    it("rejects invalid and self destinations before it removes a window", () => {
        const layout = makeRowOfTwo();
        const state: LaymanState = {layout, floatingWindows: []};
        expect(run(state, {type: "moveWindow", path: [0], newPath: [9], placement: "left"})).toBe(state);
        expect(run(state, {type: "moveWindow", path: [0], newPath: [0], placement: "left"})).toBe(state);
    });
});

describe("geometry commands", () => {
    it("changes only the targeted floating window position and z-index", () => {
        const first: FloatingWindowData = {...floatingWindow("first", tab("A", {}, "tab-a")), zIndex: 30};
        const second: FloatingWindowData = {...floatingWindow("second", tab("B", {}, "tab-b")), zIndex: 31};
        const state: LaymanState = {layout: undefined, floatingWindows: [first, second]};
        const positioned = run(state, {
            type: "setFloatingWindowPosition",
            floatingId: "first",
            position: {top: 100, left: 100, width: 400, height: 300},
        });
        expect(positioned.floatingWindows[0].position).toEqual({top: 100, left: 100, width: 400, height: 300});
        expect(run(positioned, {type: "bringFloatingWindowToFront", floatingId: "first"}).floatingWindows[0].zIndex).toBe(32);
    });

    it("moves separators and auto-arranges split proportions", () => {
        const layout = makeRowOfTwo();
        const moved = runLayout(layout, {type: "moveSeparator", path: [], index: 0, newSplitPercentage: 30}) as LaymanNode;
        expect(moved.children.map((child) => child?.viewPercent)).toEqual([30, 70]);
        const arranged = runLayout(moved, {type: "autoArrange"}) as LaymanNode;
        expect(arranged.children.map((child) => child?.viewPercent)).toEqual([50, 50]);
    });
});
