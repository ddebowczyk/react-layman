import {describe, expect, it} from "vitest";
import {computeWindowRects, findWindowAtPoint, findWindowRectAtPoint} from "../src/layoutGeometry";
import type {LaymanNode} from "../src/types";
import {tab, window} from "./helpers";

function makeRowOfTwo(): LaymanNode {
    return {
        direction: "row",
        children: [
            {...window("window-left", tab("Left", {}, "tab-left")), viewPercent: 40},
            {...window("window-right", tab("Right", {}, "tab-right")), viewPercent: 60},
        ],
    };
}

const container = {width: 1000, height: 500};

describe("computeWindowRects", () => {
    it("computes pixel rects for every leaf, proportional to viewPercent", () => {
        expect(computeWindowRects(makeRowOfTwo(), container)).toEqual([
            {path: [0], position: {top: 0, left: 0, width: 400, height: 500}},
            {path: [1], position: {top: 0, left: 400, width: 600, height: 500}},
        ]);
    });

    it("returns an empty array for an undefined layout", () => {
        expect(computeWindowRects(undefined, container)).toEqual([]);
    });
});

describe("findWindowRectAtPoint", () => {
    it("returns the path and rect of the leaf containing the point", () => {
        const layout = makeRowOfTwo();
        expect(findWindowRectAtPoint(layout, container, {x: 100, y: 250})?.path).toEqual([0]);
        expect(findWindowRectAtPoint(layout, container, {x: 900, y: 250})?.path).toEqual([1]);
    });

    it("returns null outside every leaf", () => {
        const layout = makeRowOfTwo();
        expect(findWindowRectAtPoint(undefined, container, {x: 100, y: 100})).toBeNull();
        expect(findWindowRectAtPoint(layout, container, {x: -50, y: 250})).toBeNull();
        expect(findWindowRectAtPoint(layout, container, {x: 100, y: 9999})).toBeNull();
    });

    it("uses the later window at a shared boundary", () => {
        expect(findWindowRectAtPoint(makeRowOfTwo(), container, {x: 400, y: 250})?.path).toEqual([1]);
    });
});

describe("findWindowAtPoint", () => {
    it("returns only the matching path", () => {
        const layout = makeRowOfTwo();
        expect(findWindowAtPoint(layout, container, {x: 100, y: 250})).toEqual([0]);
        expect(findWindowAtPoint(layout, container, {x: 900, y: 250})).toEqual([1]);
        expect(findWindowAtPoint(undefined, container, {x: 0, y: 0})).toBeNull();
    });
});
