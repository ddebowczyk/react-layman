// @vitest-environment jsdom
import {act, useEffect} from "react";
import {createRoot, type Root} from "react-dom/client";
import {DndProvider, useDrag, useDragDropManager} from "react-dnd";
import {createDragDropManager, type DragDropManager, type Identifier} from "dnd-core";
import {TestBackend, type ITestBackend} from "react-dnd-test-backend";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {LaymanRuntime} from "../src/LaymanContext";
import {WindowDropTarget} from "../src/WindowDropTarget";
import {FloatingDockZones} from "../src/FloatingDockZones";
import {createLaymanController} from "../src/controller";
import {LaymanDndProvider} from "../src/dnd/LaymanDndProvider";
import {tabDragType, windowDragType} from "../src/dnd/items";
import {LaymanView} from "../src/view";
import type {LaymanState} from "../src/core";
import {node, tab, window} from "./helpers";

const layout = node(
    "split-main",
    "row",
    window("window-left", tab("Left", {}, "tab-left")),
    window("window-right", tab("Right", {}, "tab-right"))
);

function workspace(): LaymanState {
    return {layout, floatingWindows: []};
}

function workspaceWithFloatingWindow(): LaymanState {
    return {
        layout,
        floatingWindows: [
            {
                id: "window-floating",
                tabs: [tab("Floating", {}, "tab-floating")],
                selectedTabId: "tab-floating",
                position: {top: 80, left: 120, width: 320, height: 240},
                zIndex: 1,
            },
        ],
    };
}

class TestResizeObserver {
    observe() {}
    disconnect() {}
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

function ManagerProbe({onManager}: {onManager: (manager: DragDropManager) => void}) {
    const manager = useDragDropManager();
    useEffect(() => {
        onManager(manager);
    }, [manager, onManager]);
    return null;
}

function TabDragSource({onHandler}: {onHandler: (handlerId: Identifier) => void}) {
    const [{handlerId}, drag] = useDrag(
        () => ({
            type: tabDragType,
            item: {path: [0], tab: tab("Left", {}, "tab-left")},
            collect: (monitor) => ({handlerId: monitor.getHandlerId()}),
        }),
        []
    );
    useEffect(() => {
        if (handlerId) onHandler(handlerId);
    }, [handlerId, onHandler]);
    return <div ref={(element) => void drag(element)}>tab drag source</div>;
}

function WindowDragSource({onHandler}: {onHandler: (handlerId: Identifier) => void}) {
    const [{handlerId}, drag] = useDrag(
        () => ({
            type: windowDragType,
            item: {id: "window-left", path: [0], tabs: [tab("Left", {}, "tab-left")], selectedTabId: "tab-left"},
            collect: (monitor) => ({handlerId: monitor.getHandlerId()}),
        }),
        []
    );
    useEffect(() => {
        if (handlerId) onHandler(handlerId);
    }, [handlerId, onHandler]);
    return <div ref={(element) => void drag(element)}>window drag source</div>;
}

function FloatingWindowDragSource({onHandler}: {onHandler: (handlerId: Identifier) => void}) {
    const [{handlerId}, drag] = useDrag(
        () => ({
            type: windowDragType,
            item: {
                id: "window-floating",
                path: {floatingId: "window-floating"},
                tabs: [tab("Floating", {}, "tab-floating")],
                selectedTabId: "tab-floating",
            },
            collect: (monitor) => ({handlerId: monitor.getHandlerId()}),
        }),
        []
    );
    useEffect(() => {
        if (handlerId) onHandler(handlerId);
    }, [handlerId, onHandler]);
    return <div ref={(element) => void drag(element)}>floating window drag source</div>;
}

function dragToCenter(backend: ITestBackend, sourceId: Identifier, targetId: Identifier) {
    act(() => {
        backend.simulateBeginDrag([sourceId], {
            clientOffset: {x: 20, y: 20},
            getSourceClientOffset: () => ({x: 20, y: 20}),
        });
        backend.simulatePublishDragSource();
        backend.simulateHover([targetId], {clientOffset: {x: 120, y: 120}});
        backend.simulateDrop();
        backend.simulateEndDrag();
    });
}

async function startDrag(backend: ITestBackend, sourceId: Identifier) {
    act(() => {
        backend.simulateBeginDrag([sourceId], {
            clientOffset: {x: 20, y: 20},
            getSourceClientOffset: () => ({x: 20, y: 20}),
        });
        backend.simulatePublishDragSource();
    });
    await act(async () => undefined);
}

function dndRuntime(children: React.ReactNode, manager: DragDropManager, controller = createLaymanController({state: workspace()})) {
    return {
        controller,
        element: (
            <LaymanRuntime
                state={controller.getState()}
                inspection={controller.inspect()}
                dispatch={controller.dispatch}
                canExecute={controller.canExecute}
                renderPane={() => <div />}
                renderTab={() => "tab"}
                renderNull={() => <div />}
                maxDepth={4}
                showTabs
                viewId="dnd-test"
                dnd={{mode: "manager", manager}}
            >
                {children}
            </LaymanRuntime>
        ),
    };
}

function targetId(container: HTMLElement): Identifier {
    const target = container.matches("[data-layman-drop-target]") ? container : container.querySelector("[data-layman-drop-target]");
    if (!target?.getAttribute("data-layman-drop-target")) throw new Error("drop target did not register");
    return target.getAttribute("data-layman-drop-target")!;
}

beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
});

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});

describe("Layman DnD configuration", () => {
    it("uses an injected manager for a view", async () => {
        const manager = createDragDropManager(TestBackend);
        let observed: DragDropManager | undefined;
        const controller = createLaymanController({state: workspace()});
        const {container, root} = mount(
            <LaymanView
                controller={controller}
                config={{viewId: "manager-view", dnd: {mode: "manager", manager}}}
                components={{Pane: () => <div />, Tab: () => <ManagerProbe onManager={(value) => (observed = value)} />}}
            />
        );

        await act(async () => undefined);
        expect(observed).toBe(manager);
        unmount(root, container);
    });

    it("uses a host DnD provider without installing a second one", async () => {
        const manager = createDragDropManager(TestBackend);
        let observed: DragDropManager | undefined;
        const controller = createLaymanController({state: workspace()});
        const {container, root} = mount(
            <DndProvider manager={manager}>
                <LaymanView
                    controller={controller}
                    config={{viewId: "external-view", dnd: {mode: "external"}}}
                    components={{Pane: () => <div />, Tab: () => <ManagerProbe onManager={(value) => (observed = value)} />}}
                />
            </DndProvider>
        );

        await act(async () => undefined);
        expect(observed).toBe(manager);
        unmount(root, container);
    });

    it("sends a tab drop through the semantic controller command", async () => {
        const manager = createDragDropManager(TestBackend);
        let sourceId: Identifier | undefined;
        const {controller, element} = dndRuntime(<><TabDragSource onHandler={(id) => (sourceId = id)} /><WindowDropTarget windowId="window-right" path={[1]} position={{top: 0, left: 400, width: 400, height: 600}} placement="center" /></>, manager);
        const {container, root} = mount(element);

        await act(async () => undefined);
        if (!sourceId) throw new Error("tab source did not register");
        dragToCenter(manager.getBackend() as ITestBackend, sourceId, targetId(container));

        expect(controller.inspect().windows.find((item) => item.id === "window-right")?.tabs.map((item) => item.id)).toEqual(["tab-right", "tab-left"]);
        unmount(root, container);
    });

    it("does not accept a policy-denied drop, and the controller rejects a direct bypass", async () => {
        const manager = createDragDropManager(TestBackend);
        const onTransition = vi.fn();
        const controller = createLaymanController({
            state: workspace(),
            onTransition,
            interaction: {
                canExecute: ({command}) =>
                    command.type === "tab.move" && command.target.kind === "window" && command.target.windowId === "window-right"
                        ? {kind: "deny", reason: "the target window is locked"}
                        : {kind: "allow"},
            },
        });
        let sourceId: Identifier | undefined;
        const {element} = dndRuntime(
            <>
                <TabDragSource onHandler={(id) => (sourceId = id)} />
                <WindowDropTarget windowId="window-right" path={[1]} position={{top: 0, left: 400, width: 400, height: 600}} placement="center" />
            </>,
            manager,
            controller
        );
        const {container, root} = mount(element);

        await act(async () => undefined);
        if (!sourceId) throw new Error("tab source did not register");
        dragToCenter(manager.getBackend() as ITestBackend, sourceId, targetId(container));

        expect(controller.inspect().windows.find((item) => item.id === "window-left")?.tabs.map((item) => item.id)).toEqual(["tab-left"]);
        expect(controller.inspect().windows.find((item) => item.id === "window-right")?.tabs.map((item) => item.id)).toEqual(["tab-right"]);
        expect(onTransition).not.toHaveBeenCalled();
        controller.dispatch({
            type: "tab.move",
            tabId: "tab-left",
            target: {kind: "window", windowId: "window-right"},
            placement: "center",
        });
        expect(onTransition).toHaveBeenLastCalledWith(
            expect.objectContaining({reason: "forbidden", denial: {kind: "deny", reason: "the target window is locked"}})
        );
        unmount(root, container);
    });

    it("sends a window drop through the semantic controller command", async () => {
        const manager = createDragDropManager(TestBackend);
        let sourceId: Identifier | undefined;
        const {controller, element} = dndRuntime(<><WindowDragSource onHandler={(id) => (sourceId = id)} /><WindowDropTarget windowId="window-right" path={[1]} position={{top: 0, left: 400, width: 400, height: 600}} placement="center" /></>, manager);
        const {container, root} = mount(element);

        await act(async () => undefined);
        if (!sourceId) throw new Error("window source did not register");
        dragToCenter(manager.getBackend() as ITestBackend, sourceId, targetId(container));

        expect(controller.inspect().windows).toEqual([
            expect.objectContaining({id: "window-right", tabs: [expect.objectContaining({id: "tab-right"}), expect.objectContaining({id: "tab-left"})]}),
        ]);
        unmount(root, container);
    });

    it("docks a floating window through the same policy-gated command boundary", async () => {
        const manager = createDragDropManager(TestBackend);
        const controller = createLaymanController({state: workspaceWithFloatingWindow()});
        let sourceId: Identifier | undefined;
        const {element} = dndRuntime(
            <>
                <FloatingWindowDragSource onHandler={(id) => (sourceId = id)} />
                <FloatingDockZones />
            </>,
            manager,
            controller
        );
        const {container, root} = mount(element);

        await act(async () => undefined);
        if (!sourceId) throw new Error("floating window source did not register");
        const backend = manager.getBackend() as ITestBackend;
        await startDrag(backend, sourceId);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        const topDockTarget = container.querySelector<HTMLElement>('[data-layman-dock-edge="top"]');
        if (!topDockTarget) throw new Error("top dock zone did not render");

        act(() => {
            backend.simulateHover([targetId(topDockTarget)]);
            backend.simulateDrop();
            backend.simulateEndDrag();
        });

        expect(controller.getState().floatingWindows).toEqual([]);
        expect(controller.inspect().windows.some((item) => item.id === "window-floating")).toBe(true);
        unmount(root, container);
    });

    it("tears down an injected backend when its view unmounts", async () => {
        let backend: ITestBackend | undefined;
        const {container, root} = mount(
            <LaymanDndProvider config={{mode: "internal", backend: TestBackend, context: {}, options: {onCreate: (value) => (backend = value as ITestBackend)}}}>
                <TabDragSource onHandler={() => undefined} />
            </LaymanDndProvider>
        );

        await act(async () => undefined);
        expect(backend?.didCallSetup).toBe(true);
        unmount(root, container);
        expect(backend?.didCallTeardown).toBe(true);
    });
});
