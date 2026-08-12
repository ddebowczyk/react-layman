import {describe, expect, it} from "vitest";

describe.sequential("browser-test runtime", () => {
    it("provides isolated in-memory storage", () => {
        localStorage.setItem("layman", "first-test");
        expect(localStorage.getItem("layman")).toBe("first-test");
    });

    it("resets storage before the next test", () => {
        expect(localStorage.getItem("layman")).toBeNull();
    });
});
