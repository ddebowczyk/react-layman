import {describe, expect, it} from "vitest";
import {
    deserializeLayout,
    deserializeState,
    deserializeTab,
    serializeFloatingWindow,
    serializeLayout,
    serializeState,
    validateLaymanSnapshot,
} from "../src/Serializer";
import type {FloatingWindowData, LaymanNode, LaymanSerializedState, LaymanWindow} from "../src/types";
import {node, tab, window} from "./helpers";

describe("current snapshot serialization", () => {
    it("serializes a window with durable window, tab, and selection identities", () => {
        const editor = tab("Editor", {path: "/a.ts"}, "tab-editor");
        const preview = tab("Preview", {}, "tab-preview");
        const layout: LaymanWindow = {...window("window-editor", editor, preview), selectedTabId: preview.id};

        expect(serializeLayout(layout)).toEqual({
            kind: "window",
            id: "window-editor",
            selectedTabId: "tab-preview",
            tabs: [
                {id: "tab-editor", title: "Editor", data: {path: "/a.ts"}},
                {id: "tab-preview", title: "Preview", data: {}},
            ],
            viewPercent: undefined,
        });
    });

    it("reconstructs plain tab and window values without changing IDs", () => {
        expect(deserializeTab({id: "tab-term", title: "Term", data: {cwd: "/tmp"}})).toEqual({
            id: "tab-term",
            title: "Term",
            data: {cwd: "/tmp"},
        });

        const result = deserializeLayout({
            kind: "window",
            id: "window-main",
            selectedTabId: "tab-b",
            viewPercent: 25,
            tabs: [
                {id: "tab-a", title: "A", data: {}},
                {id: "tab-b", title: "B", data: {flag: true}},
            ],
        }) as LaymanWindow;
        expect(result).toMatchObject({id: "window-main", selectedTabId: "tab-b", viewPercent: 25});
        expect(result.tabs[1]).toEqual({id: "tab-b", title: "B", data: {flag: true}});
    });
});

describe("versioned state snapshots", () => {
    it("round-trips tiled and floating windows without changing stable IDs", () => {
        const left = tab("Left", {path: "/left"}, "tab-left");
        const right = tab("Right", {}, "tab-right");
        const floater = tab("Floater", {kind: "note"}, "tab-float");
        const layout: LaymanNode = node("split-main", "row", window("window-left", left), window("window-right", right));
        const floatingWindow: FloatingWindowData = {
            id: "window-floating",
            tabs: [floater],
            selectedTabId: floater.id,
            position: {top: 10, left: 20, width: 300, height: 200},
            zIndex: 32,
        };

        const snapshot = serializeState({layout, floatingWindows: [floatingWindow]});
        expect(snapshot.schemaVersion).toBe(2);
        expect(serializeState(deserializeState(snapshot))).toEqual(snapshot);
        expect(serializeFloatingWindow(floatingWindow).id).toBe("window-floating");
    });

    it("rejects old, incomplete, and internally inconsistent data", () => {
        expect(() => deserializeState({layout: null, floatingWindows: []})).toThrow("schemaVersion");
        expect(() => deserializeState({schemaVersion: 1, layout: null, floatingWindows: []})).toThrow("schemaVersion");
        expect(() => deserializeTab({id: "tab", name: "old", data: {}} as never)).toThrow("title");
        expect(() => deserializeState({schemaVersion: 2, layout: null, floatingWindows: [], extra: true})).toThrow("unknown property");
        expect(() =>
            deserializeState({
                schemaVersion: 2,
                layout: null,
                floatingWindows: [
                    {
                        id: "window-zero-width",
                        tabs: [],
                        selectedTabId: null,
                        position: {top: 0, left: 0, width: 0, height: 100},
                        zIndex: 30,
                    },
                ],
            })
        ).toThrow("width and height must be greater than zero");

        const snapshot: LaymanSerializedState = {
            schemaVersion: 2,
            layout: {
                kind: "window",
                id: "window-shared",
                selectedTabId: "tab-a",
                tabs: [{id: "tab-a", title: "A", data: {}}],
            },
            floatingWindows: [
                {
                    id: "window-shared",
                    selectedTabId: null,
                    tabs: [],
                    position: {top: 0, left: 0, width: 100, height: 100},
                    zIndex: 30,
                },
            ],
        };
        expect(() => validateLaymanSnapshot(snapshot)).toThrow("duplicate layout id");

        snapshot.floatingWindows[0].id = "window-float";
        snapshot.layout = {
            kind: "window",
            id: "window-main",
            selectedTabId: null,
            tabs: [{id: "tab-a", title: "A", data: {}}],
        };
        expect(() => validateLaymanSnapshot(snapshot)).toThrow("non-empty window must select a tab");

        expect(() =>
            deserializeState({
                schemaVersion: 2,
                layout: {
                    kind: "node",
                    id: "split-invalid",
                    direction: "row",
                    children: [
                        {kind: "window", id: "window-main", selectedTabId: "tab-main", tabs: [{id: "tab-main", title: "Main", data: {}}]},
                        null,
                    ],
                },
                floatingWindows: [],
            })
        ).toThrow("split children");
    });
});
