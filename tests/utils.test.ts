import {describe, expect, it} from "vitest";
import {deepClone, deepEqual} from "../src/utils";
import type {LaymanNode, LaymanWindow} from "../src/types";
import {tab, window} from "./helpers";

describe("deepClone", () => {
    it("returns primitives unchanged", () => {
        expect(deepClone(42)).toBe(42);
        expect(deepClone("hi")).toBe("hi");
        expect(deepClone(true)).toBe(true);
        expect(deepClone(null)).toBeNull();
        expect(deepClone(undefined)).toBeUndefined();
    });

    it("clones nested objects and arrays without sharing references", () => {
        const original = {a: 1, b: {c: [1, 2, {d: 3}]}};
        const cloned = deepClone(original);
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.b).not.toBe(original.b);
        expect(cloned.b.c).not.toBe(original.b.c);
        expect(cloned.b.c[2]).not.toBe(original.b.c[2]);
    });

    it("does not mutate the original value", () => {
        const original = {nested: {value: 1}};
        const cloned = deepClone(original);
        cloned.nested.value = 99;
        expect(original.nested.value).toBe(1);
    });

    it("deep-clones plain tab data in a layout tree", () => {
        const layout: LaymanNode = {
            direction: "row",
            children: [
                {...window("window-a", tab("A", {path: "/a"}, "tab-a"), tab("B", {}, "tab-b")), viewPercent: 50},
                {...window("window-c", tab("C", {}, "tab-c")), viewPercent: 50},
            ],
        };

        const cloned = deepClone(layout);
        const originalWindow = layout.children[0] as LaymanWindow;
        const clonedWindow = cloned.children[0] as LaymanWindow;
        expect(cloned).toEqual(layout);
        expect(cloned).not.toBe(layout);
        expect(clonedWindow.tabs[0]).not.toBe(originalWindow.tabs[0]);
        expect(clonedWindow.tabs[0].data).not.toBe(originalWindow.tabs[0].data);
    });

    it("clones Date and RegExp values", () => {
        const date = new Date(1000);
        const clonedDate = deepClone(date);
        expect(clonedDate).toBeInstanceOf(Date);
        expect(clonedDate.getTime()).toBe(1000);
        expect(clonedDate).not.toBe(date);

        const expression = /abc/gi;
        const clonedExpression = deepClone(expression);
        expect(clonedExpression).toBeInstanceOf(RegExp);
        expect(clonedExpression.source).toBe("abc");
        expect(clonedExpression.flags).toBe("gi");
    });
});

describe("deepEqual", () => {
    it("compares primitives and NaN", () => {
        expect(deepEqual(1, 1)).toBe(true);
        expect(deepEqual("a", "a")).toBe(true);
        expect(deepEqual(1, 2)).toBe(false);
        expect(deepEqual(1, "1")).toBe(false);
        expect(deepEqual(null, null)).toBe(true);
        expect(deepEqual(null, undefined)).toBe(false);
        expect(deepEqual(NaN, NaN)).toBe(true);
    });

    it("compares paths and nested values structurally", () => {
        expect(deepEqual([0, 1, 2], [0, 1, 2])).toBe(true);
        expect(deepEqual([0, 1], [0, 1, 2])).toBe(false);
        expect(deepEqual([1, 2], {0: 1, 1: 2})).toBe(false);
        expect(deepEqual({a: {b: [1, 2]}}, {a: {b: [1, 2]}})).toBe(true);
        expect(deepEqual({a: {b: [1, 2]}}, {a: {b: [1, 3]}})).toBe(false);
        expect(deepEqual({a: 1, b: undefined}, {a: 1})).toBe(false);
    });

    it("compares Date and RegExp values", () => {
        expect(deepEqual(new Date(5), new Date(5))).toBe(true);
        expect(deepEqual(new Date(5), new Date(6))).toBe(false);
        expect(deepEqual(/x/g, /x/g)).toBe(true);
        expect(deepEqual(/x/g, /x/i)).toBe(false);
    });
});
