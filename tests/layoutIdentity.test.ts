import {describe, expect, it} from "vitest";
import {LaymanReducer} from "../src/LaymanReducer";
import {createLaymanTab, createLaymanWindow} from "../src/createLaymanTab";
import type {LaymanNode, LaymanState, LaymanWindow} from "../src/types";
import {tab, window} from "./helpers";

describe("stable layout identities", () => {
    it("creates valid values and rejects invalid IDs or selections at the boundary", () => {
        const editor = createLaymanTab("Editor", {path: "/editor"}, "tab-editor");
        expect(createLaymanWindow([editor], "window-editor")).toMatchObject({selectedTabId: "tab-editor"});
        expect(() => createLaymanTab("Bad", {}, "")).toThrow("tab id");
        expect(() => createLaymanWindow([editor], "window-editor", "tab-missing")).toThrow("selectedTabId");
    });

    it("keeps a window ID while a split changes its temporary render path", () => {
        const rootTab = tab("Root", {}, "tab-root");
        const addedTab = tab("Added", {}, "tab-added");
        const root = window("window-root", rootTab);
        const state: LaymanState = {layout: root, floatingWindows: []};

        const result = LaymanReducer(state, {
            type: "addWindow",
            path: [],
            window: window("window-added", addedTab),
            placement: "left",
        });

        const split = result.layout as LaymanNode;
        expect(split.children[0]).toMatchObject({id: "window-added"});
        expect(split.children[1]).toMatchObject({id: "window-root"});
        expect((split.children[1] as LaymanWindow).tabs[0].id).toBe("tab-root");
    });
});
