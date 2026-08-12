import {fireEvent, screen, within} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {floatingWindow, renderLaymanView, tab, window} from "./viewHarness";

describe("Layman view interactions", () => {
    beforeEach(() => {
        // user-event schedules real browser interactions. The shared runtime
        // still fixes time for tests that need it, while these UI flows use the
        // browser event queue exactly as an application does.
        vi.useRealTimers();
    });

    it("renders the empty component", () => {
        renderLaymanView({state: {layout: undefined, floatingWindows: []}});

        expect(screen.getByText("No windows")).toBeTruthy();
    });

    it("selects a tab through the controlled controller", async () => {
        const first = tab("First", {}, "tab-first");
        const second = tab("Second", {}, "tab-second");
        const {controller, transitions, user} = renderLaymanView({
            state: {layout: window("window-main", first, second), floatingWindows: []},
        });

        await user.click(screen.getByRole("button", {name: "Second"}));

        expect(controller.inspect().windows[0]?.selectedTabId).toBe("tab-second");
        expect(transitions).toContainEqual(expect.objectContaining({command: {type: "tab.select", tabId: "tab-second"}, status: "applied"}));
    });

    it("closes a tab through an accessible control", async () => {
        const first = tab("First", {}, "tab-first");
        const second = tab("Second", {}, "tab-second");
        const {controller, user} = renderLaymanView({
            state: {layout: window("window-main", first, second), floatingWindows: []},
        });

        await user.click(screen.getByRole("button", {name: "Close Second"}));

        expect(controller.inspect().windows[0]).toMatchObject({
            selectedTabId: "tab-first",
            tabs: [{id: "tab-first"}],
        });
    });

    it("maximizes and restores a tiled window", async () => {
        const left = window("window-left", tab("Left", {}, "tab-left"));
        const right = window("window-right", tab("Right", {}, "tab-right"));
        const {root, user} = renderLaymanView({
            state: {
                layout: {id: "split-main", direction: "row", children: [left, right]},
                floatingWindows: [],
            },
        });
        const toolbar = root.querySelector<HTMLElement>('[data-layman-component="toolbar"][data-layman-window="window-left"]');
        if (!toolbar) throw new Error("Left toolbar did not render.");

        await user.click(within(toolbar).getByRole("button", {name: "Maximize window"}));
        expect(root.querySelector<HTMLElement>('[data-layman-window="window-left"]')?.style.width).toBe("796px");

        await user.click(within(toolbar).getByRole("button", {name: "Restore window"}));
        expect(root.querySelector<HTMLElement>('[data-layman-window="window-left"]')?.style.width).toBe("396px");
    });

    it("resizes a floating window from a document mouse interaction", () => {
        const floating = floatingWindow("window-floating", tab("Floating", {}, "tab-floating"));
        const {controller, root} = renderLaymanView({state: {layout: undefined, floatingWindows: [floating]}});
        const handle = root.querySelector<HTMLElement>('[data-layman-resize-direction="se"]');
        if (!handle) throw new Error("Floating resize handle did not render.");

        fireEvent.mouseDown(handle, {clientX: 100, clientY: 100});
        fireEvent.mouseMove(document, {clientX: 160, clientY: 140});
        fireEvent.mouseUp(document);

        expect(controller.getState().floatingWindows[0]?.position).toEqual({top: 0, left: 0, width: 360, height: 240});
    });
});
