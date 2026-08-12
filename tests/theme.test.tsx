// @vitest-environment jsdom
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {createDragDropManager} from "dnd-core";
import {TestBackend} from "react-dnd-test-backend";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {createLaymanController} from "../src/controller";
import {LaymanView} from "../src/view";
import type {LaymanComponents, LaymanViewConfig} from "../src/view";
import {tab, window} from "./helpers";

class TestResizeObserver {
    observe() {}
    disconnect() {}
}

const components: LaymanComponents = {
    Pane: ({tab}) => <div data-pane={tab.id}>Pane</div>,
    Tab: ({tab}) => tab.title,
    Empty: () => <div>Empty</div>,
    ToolbarFrame: ({children, window: toolbarWindow}) => <section data-toolbar-frame={toolbarWindow.id}>{children}</section>,
};

function view(viewId: string, toolbarHeight: number, separatorThickness: number) {
    const controller = createLaymanController({
        state: {layout: window(`window-${viewId}`, tab(viewId, {}, `tab-${viewId}`)), floatingWindows: []},
    });
    const config: LaymanViewConfig = {
        viewId,
        dnd: {mode: "manager", manager: createDragDropManager(TestBackend)},
        theme: {toolbarHeight, separatorThickness, accentColor: viewId === "left" ? "#ff0000" : "#0000ff"},
    };
    return (
        <LaymanView
            controller={controller}
            config={config}
            components={components}
            className={`view-${viewId}`}
            style={viewId === "left" ? {zIndex: 11} : undefined}
        />
    );
}

function mount(element: React.ReactElement) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    act(() => root.render(element));
    return {container, root};
}

function unmount(root: Root, container: HTMLElement) {
    act(() => root.unmount());
    container.remove();
}

beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
});

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});

describe("Layman view themes and slots", () => {
    it("keeps focus and motion tokens scoped to each view root", () => {
        const stylesheet = readFileSync(resolve(process.cwd(), "styles/global.css"), "utf8");

        expect(stylesheet).toContain(".layman-root {");
        expect(stylesheet).not.toContain(":root");
        expect(stylesheet).toContain("button:focus-visible");
        expect(stylesheet).toContain("outline: 2px solid var(--layman-accent-color)");
        expect(stylesheet).toContain("@media (prefers-reduced-motion: reduce)");
        expect(stylesheet).toContain("--layman-motion-duration: 0ms");
    });

    it("scopes themes and geometry to each view root", () => {
        const {container, root} = mount(
            <>
                {view("left", 48, 12)}
                {view("right", 24, 6)}
            </>
        );

        const left = container.querySelector<HTMLElement>('[data-layman-view="left"]');
        const right = container.querySelector<HTMLElement>('[data-layman-view="right"]');
        expect(left?.classList.contains("view-left")).toBe(true);
        expect(left?.style.zIndex).toBe("11");
        expect(left?.style.getPropertyValue("--layman-toolbar-height")).toBe("48px");
        expect(right?.style.getPropertyValue("--layman-toolbar-height")).toBe("24px");
        expect(document.documentElement.style.getPropertyValue("--layman-toolbar-height")).toBe("");

        expect(left?.querySelector('[data-layman-component="toolbar"]')?.getAttribute("style")).toContain("height: 48px");
        expect(right?.querySelector('[data-layman-component="toolbar"]')?.getAttribute("style")).toContain("height: 24px");
        expect(left?.querySelector('[data-layman-component="window"]')?.getAttribute("style")).toContain("top: 54px");
        expect(right?.querySelector('[data-layman-component="window"]')?.getAttribute("style")).toContain("top: 27px");
        expect(left?.querySelector('[data-toolbar-frame="window-left"]')).not.toBeNull();
        expect(right?.querySelector('[data-toolbar-frame="window-right"]')).not.toBeNull();
        expect(left?.querySelector('[data-layman-window="window-left"][data-layman-tab="tab-left"]')).not.toBeNull();

        unmount(root, container);
    });

    it("removes only the unmounted view's local styles", () => {
        const {container, root} = mount(
            <>
                {view("left", 48, 12)}
                {view("right", 24, 6)}
            </>
        );

        act(() => root.render(view("right", 24, 6)));

        expect(container.querySelector('[data-layman-view="left"]')).toBeNull();
        const right = container.querySelector<HTMLElement>('[data-layman-view="right"]');
        expect(right?.style.getPropertyValue("--layman-toolbar-height")).toBe("24px");
        expect(document.documentElement.style.getPropertyValue("--layman-toolbar-height")).toBe("");

        unmount(root, container);
    });
});
