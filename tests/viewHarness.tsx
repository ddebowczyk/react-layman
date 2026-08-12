import {act, render} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createDragDropManager} from "dnd-core";
import {TestBackend} from "react-dnd-test-backend";
import {createLaymanController} from "../src/controller";
import type {LaymanControllerTransition} from "../src/controller";
import type {LaymanState} from "../src/core";
import {LaymanView} from "../src/view";
import type {LaymanComponents, LaymanViewConfig} from "../src/view";
import {setElementRect, TestResizeObserver, type TestRect} from "./setup";

export {floatingWindow, node, tab, window} from "./helpers";

export const viewComponents: LaymanComponents = {
    Pane: ({tab}) => <div data-layman-test-pane={tab.id}>{tab.title} pane</div>,
    Tab: ({tab}) => tab.title,
    Empty: () => <p>No windows</p>,
};

export const defaultViewRect: TestRect = {top: 0, left: 0, width: 800, height: 600};

interface RenderLaymanViewOptions {
    state: LaymanState;
    viewId?: string;
    config?: Omit<LaymanViewConfig, "viewId">;
    components?: LaymanComponents;
    rect?: TestRect;
}

/** Renders one controlled view with an injected DnD manager and stable geometry. */
export function renderLaymanView({
    state,
    viewId = "test-view",
    config = {},
    components = viewComponents,
    rect = defaultViewRect,
}: RenderLaymanViewOptions) {
    const transitions: LaymanControllerTransition[] = [];
    const controller = createLaymanController({state, onTransition: (transition) => transitions.push(transition)});
    const result = render(
        <LaymanView
            controller={controller}
            config={{viewId, dnd: {mode: "manager", manager: createDragDropManager(TestBackend)}, ...config}}
            components={components}
        />
    );
    const root = result.container.querySelector<HTMLElement>(`[data-layman-view="${viewId}"]`);
    if (!root) throw new Error(`Layman view '${viewId}' did not render.`);
    setElementRect(root, rect);
    act(() => TestResizeObserver.emit(root));
    return {controller, root, transitions, user: userEvent.setup(), ...result};
}
