import {createElement} from "react";
import {act} from "react-dom/test-utils";
import {createRoot, Root} from "react-dom/client";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {Layman} from "../src/Layman";
import {LaymanProvider} from "../src/LaymanContext";
import {TabData} from "../src/TabData";
import {Position} from "../src/types";

const rects: Record<string, Position> = {
    alpha: {top: 10, left: 20, width: 320, height: 240},
    beta: {top: 30, left: 40, width: 640, height: 480},
};

class TestResizeObserver {
    static instances: TestResizeObserver[] = [];
    target: Element | null = null;
    disconnected = false;

    constructor(private readonly callback: ResizeObserverCallback) {
        TestResizeObserver.instances.push(this);
    }

    observe(target: Element) {
        this.target = target;
    }

    disconnect() {
        this.disconnected = true;
    }

    static emit(target: Element) {
        const observer = TestResizeObserver.instances.find((candidate) => candidate.target === target);
        if (!observer) throw new Error("Missing observer for Layman view.");
        observer.callback([{target} as ResizeObserverEntry], observer as unknown as ResizeObserver);
    }
}

const mountedRoots: Root[] = [];

function renderView(viewId: string) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mountedRoots.push(root);
    const tab = new TabData(viewId);

    act(() => {
        root.render(
            createElement(
                LaymanProvider,
                {
                    initialLayout: {tabs: [tab], selectedIndex: 0},
                    renderPane: (pane) => createElement("p", null, pane.name),
                    renderTab: (tabData) => tabData.name,
                    renderNull: createElement("p", null, "Empty"),
                    viewId,
                },
                createElement(Layman)
            )
        );
    });

    const view = container.querySelector(`[data-layman-view="${viewId}"]`);
    if (!view) throw new Error(`Missing ${viewId} view.`);
    return view as HTMLElement;
}

beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
        const viewId = this.getAttribute("data-layman-view");
        const rect = rects[viewId ?? ""] ?? {top: 0, left: 0, width: 0, height: 0};
        return {
            ...rect,
            x: rect.left,
            y: rect.top,
            right: rect.left + rect.width,
            bottom: rect.top + rect.height,
            toJSON: () => ({}),
        } as DOMRect;
    });
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
        const viewId = element.getAttribute("data-layman-view");
        const toolbarHeight = viewId === "alpha" ? "40px" : "72px";
        return {getPropertyValue: (name) => (name === "--toolbar-height" ? toolbarHeight : "")} as CSSStyleDeclaration;
    });
});

afterEach(() => {
    mountedRoots.splice(0).forEach((root) => act(() => root.unmount()));
    TestResizeObserver.instances = [];
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});

describe("Layman view isolation", () => {
    it("scopes portals, style tokens, measurements, and observer cleanup to each view", () => {
        const alpha = renderView("alpha");
        const beta = renderView("beta");

        expect(document.querySelectorAll("#drag-window-border")).toHaveLength(0);
        expect(alpha.querySelector(".layman-drag-window-border")).toBeTruthy();
        expect(beta.querySelector(".layman-drag-window-border")).toBeTruthy();
        expect(alpha.querySelector(".layman-drag-window-border")).not.toBe(
            beta.querySelector(".layman-drag-window-border")
        );
        expect(alpha.querySelector<HTMLElement>(".layman-toolbar")?.style).toMatchObject({
            width: "312px",
            height: "40px",
        });
        expect(beta.querySelector<HTMLElement>(".layman-toolbar")?.style).toMatchObject({
            width: "632px",
            height: "72px",
        });
        expect(TestResizeObserver.instances).toHaveLength(2);

        rects.alpha = {...rects.alpha, width: 480};
        act(() => TestResizeObserver.emit(alpha));
        expect(alpha.querySelector<HTMLElement>(".layman-toolbar")?.style.width).toBe("472px");
        expect(beta.querySelector<HTMLElement>(".layman-toolbar")?.style.width).toBe("632px");
        expect(TestResizeObserver.instances).toHaveLength(2);

        const [alphaObserver, betaObserver] = TestResizeObserver.instances;
        act(() => mountedRoots.shift()?.unmount());
        expect(alphaObserver.disconnected).toBe(true);
        expect(betaObserver.disconnected).toBe(false);
    });
});
