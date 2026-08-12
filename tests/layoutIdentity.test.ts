import {describe, expect, it} from "vitest";
import {inspectLaymanState, validateLaymanState} from "../src/core";
import {createLaymanTab, createLaymanWindow} from "../src/createLaymanTab";
import type {LaymanState} from "../src/types";
import {floatingWindow, node, tab, window} from "./helpers";

describe("stable layout identities and inspection", () => {
    it("creates valid values and rejects invalid IDs or selections at the boundary", () => {
        const editor = createLaymanTab("Editor", {path: "/editor"}, "tab-editor");
        expect(createLaymanWindow([editor], "window-editor")).toMatchObject({selectedTabId: "tab-editor"});
        expect(() => createLaymanTab("Bad", {}, "")).toThrow("tab id");
        expect(() => createLaymanTab("Bad", new Date() as never, "tab-bad")).toThrow("JSON-serializable");
        expect(() => createLaymanWindow([editor], "window-editor", "tab-missing")).toThrow("selectedTabId");
    });

    it("reports parentage, siblings, selection, floating geometry, and detached tab data", () => {
        const editor = tab("Editor", {path: "/editor"}, "tab-editor");
        const state: LaymanState = {
            layout: node(
                "split-root",
                "row",
                window("window-editor", editor),
                node("split-side", "column", window("window-preview", tab("Preview", {}, "tab-preview")), window("window-console", tab("Console", {}, "tab-console")))
            ),
            floatingWindows: [{...floatingWindow("window-inspector", tab("Inspector", {open: true}, "tab-inspector")), position: {top: 12, left: 24, width: 320, height: 240}, zIndex: 35}],
        };

        const inspection = inspectLaymanState(state);
        expect(inspection.rootId).toBe("split-root");
        expect(inspection.splits).toEqual([
            {id: "split-root", parentSplitId: null, direction: "row", childIds: ["window-editor", "split-side"]},
            {id: "split-side", parentSplitId: "split-root", direction: "column", childIds: ["window-preview", "window-console"]},
        ]);
        expect(inspection.windows.find((candidate) => candidate.id === "window-editor")).toMatchObject({
            location: "tiled",
            parentSplitId: "split-root",
            siblingIds: ["split-side"],
            selectedTabId: "tab-editor",
        });
        expect(inspection.windows.find((candidate) => candidate.id === "window-inspector")).toMatchObject({
            location: "floating",
            position: {top: 12, left: 24, width: 320, height: 240},
            zIndex: 35,
        });

        const inspectedData = inspection.windows.find((candidate) => candidate.id === "window-editor")!.tabs[0].data as {path: string};
        inspectedData.path = "/changed-only-in-inspection";
        expect((state.layout as {tabs: readonly {data: {path: string}}[]} ).tabs).toBeUndefined();
        const editorWindow = (state.layout as {children: readonly {id: string; tabs?: readonly {data: {path: string}}[]}[]}).children[0];
        expect(editorWindow.tabs![0].data.path).toBe("/editor");
    });

    it("rejects duplicate IDs across split, tiled, and floating entities", () => {
        const state: LaymanState = {
            layout: node("split-main", "row", window("window-main", tab("Main", {}, "tab-main")), window("window-side", tab("Side", {}, "tab-side"))),
            floatingWindows: [floatingWindow("split-main", tab("Float", {}, "tab-float"))],
        };

        expect(validateLaymanState(state)).toMatchObject({valid: false, issues: ["duplicate-layout-id"]});
    });
});
