import {act, render} from "@testing-library/react";
import {createDragDropManager} from "dnd-core";
import {TestBackend} from "react-dnd-test-backend";
import {describe, expect, it} from "vitest";
import {createLaymanController} from "../src/controller";
import type {LaymanController} from "../src/controller";
import {LaymanView} from "../src/view";
import {setElementRect, TestResizeObserver} from "./setup";
import {tab, viewComponents, window} from "./viewHarness";

function createViewController(viewId: string) {
    return createLaymanController({state: {layout: window(`window-${viewId}`, tab(viewId, {}, `tab-${viewId}`)), floatingWindows: []}});
}

function view(viewId: string, toolbarHeight: number, controller: LaymanController) {
    return (
        <LaymanView
            controller={controller}
            config={{
                viewId,
                dnd: {mode: "manager", manager: createDragDropManager(TestBackend)},
                theme: {toolbarHeight, separatorThickness: 4},
            }}
            components={viewComponents}
        />
    );
}

function workspace(includeLeft: boolean, left: LaymanController, right: LaymanController) {
    return <>{includeLeft && view("left", 48, left)}{view("right", 24, right)}</>;
}

function root(container: HTMLElement, viewId: string) {
    const element = container.querySelector<HTMLElement>(`[data-layman-view="${viewId}"]`);
    if (!element) throw new Error(`Missing view '${viewId}'.`);
    return element;
}

describe("Layman view isolation", () => {
    it("owns portal targets, geometry, and observers per view", () => {
        const leftController = createViewController("left");
        const rightController = createViewController("right");
        const rendered = render(workspace(true, leftController, rightController));
        const left = root(rendered.container, "left");
        const right = root(rendered.container, "right");
        setElementRect(left, {top: 10, left: 20, width: 400, height: 300});
        setElementRect(right, {top: 30, left: 40, width: 800, height: 600});
        act(() => {
            TestResizeObserver.emit(left);
            TestResizeObserver.emit(right);
        });

        expect(document.querySelectorAll("#drag-window-border")).toHaveLength(0);
        expect(document.querySelectorAll("[id]")).toHaveLength(0);
        expect(left.id).toBe("");
        expect(right.id).toBe("");
        expect(left.querySelector('[data-layman-component="drag-border-layer"]')).not.toBeNull();
        expect(right.querySelector('[data-layman-component="drag-border-layer"]')).not.toBeNull();
        expect(left.querySelector('[data-layman-component="drag-border-layer"]')).not.toBe(
            right.querySelector('[data-layman-component="drag-border-layer"]')
        );
        expect(left.querySelector(".layman-drop-highlight")).not.toBeNull();
        expect(right.querySelector(".layman-drop-highlight")).not.toBeNull();
        expect(left.querySelector(".layman-drop-highlight")).not.toBe(right.querySelector(".layman-drop-highlight"));
        expect(left.querySelector<HTMLElement>('[data-layman-component="toolbar"]')?.style.width).toBe("396px");
        expect(right.querySelector<HTMLElement>('[data-layman-component="toolbar"]')?.style.width).toBe("796px");

        const [leftObserver, rightObserver] = TestResizeObserver.instances;
        expect(leftObserver?.targets.has(left)).toBe(true);
        expect(rightObserver?.targets.has(right)).toBe(true);

        setElementRect(left, {top: 10, left: 20, width: 600, height: 300});
        act(() => TestResizeObserver.emit(left));
        expect(left.querySelector<HTMLElement>('[data-layman-component="toolbar"]')?.style.width).toBe("596px");
        expect(right.querySelector<HTMLElement>('[data-layman-component="toolbar"]')?.style.width).toBe("796px");

        rendered.rerender(workspace(false, leftController, rightController));
        expect(leftObserver?.disconnect).toHaveBeenCalledTimes(1);
        expect(rightObserver?.disconnect).not.toHaveBeenCalled();
    });
});
