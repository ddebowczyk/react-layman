import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {loadState, saveState} from "../src/persistence";
import {serializeLayout} from "../src/Serializer";
import type {FloatingWindowData, LaymanNode, LaymanState, LaymanWindow} from "../src/types";
import {floatingWindow, node, tab, window as layoutWindow} from "./helpers";

const KEY = "layman-test-layout";

function makeLayout(): LaymanNode {
    return {
        ...node(
            "split-main",
            "row",
            {...layoutWindow("window-left", tab("Left", {path: "/a"}, "tab-left")), viewPercent: 50},
            {...layoutWindow("window-right", tab("Right", {}, "tab-right")), viewPercent: 50}
        ),
        viewPercent: 50,
    };
}

function makeFloatingWindows(): FloatingWindowData[] {
    return [
        {
            ...floatingWindow("float-1", tab("Floater", {kind: "note"}, "tab-floater")),
            position: {top: 10, left: 20, width: 300, height: 200},
        },
    ];
}

describe("saveState / loadState", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("does nothing when no storage key is provided", () => {
        const fallback: LaymanState = {layout: makeLayout(), floatingWindows: []};
        saveState(undefined, fallback);
        expect(window.localStorage.length).toBe(0);
        expect(loadState(undefined, fallback)).toBe(fallback);
    });

    it("writes the exact versioned layout snapshot", () => {
        const layout = makeLayout();
        saveState(KEY, {layout, floatingWindows: []});
        const saved = JSON.parse(window.localStorage.getItem(KEY) as string);
        expect(saved.schemaVersion).toBe(2);
        expect(saved.layout).toEqual(serializeLayout(layout));
    });

    it("round-trips tiled and floating windows as plain stable values", () => {
        const layout = makeLayout();
        const floatingWindows = makeFloatingWindows();
        const fallback: LaymanState = {layout: layoutWindow("fallback", tab("Fallback", {}, "tab-fallback")), floatingWindows: []};

        saveState(KEY, {layout, floatingWindows});
        const restored = loadState(KEY, fallback);

        expect(serializeLayout(restored.layout)).toEqual(serializeLayout(layout));
        const firstWindow = (restored.layout as LaymanNode).children[0] as LaymanWindow;
        expect(firstWindow.tabs[0]).toEqual({id: "tab-left", title: "Left", data: {path: "/a"}});
        expect(restored.floatingWindows[0]).toMatchObject({
            id: "float-1",
            selectedTabId: "tab-floater",
            position: floatingWindows[0].position,
            zIndex: 30,
        });
        expect(restored.floatingWindows[0].tabs[0]).toEqual({id: "tab-floater", title: "Floater", data: {kind: "note"}});
    });

    it("returns the fallback and warns for missing, corrupt, or invalid stored state", () => {
        const fallback: LaymanState = {layout: layoutWindow("fallback", tab("Fallback", {}, "tab-fallback")), floatingWindows: []};
        expect(loadState("does-not-exist", fallback)).toBe(fallback);

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        window.localStorage.setItem(KEY, "{not valid json");
        expect(loadState(KEY, fallback)).toBe(fallback);

        window.localStorage.setItem(KEY, JSON.stringify({layout: {}, floatingWindows: []}));
        expect(loadState(KEY, fallback)).toBe(fallback);
        expect(warn).toHaveBeenCalledTimes(2);
    });
});
