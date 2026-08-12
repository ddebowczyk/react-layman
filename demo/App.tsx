import {useState} from "react";
import {createLaymanTab, LaymanComponents, LaymanState, LaymanToolbarConfig, LaymanView, useLaymanController} from "../src";
import Pane from "./Pane";
import Button from "./extra/Button";
import FloatingPanel from "./extra/FloatingPanel";
import NumberStepper from "./extra/NumberStepper";
import Toggle from "./extra/Toggle";
import {initialLayout} from "./initialLayout";
import type {ModuleDescriptor} from "./modules";

const components: LaymanComponents<ModuleDescriptor> = {
    Pane: ({tab}) => <Pane paneId={`${tab.data.kind}:${tab.data.moduleId}`} />,
    Tab: ({tab}) => <>{tab.title}</>,
    Empty: ({dispatch}) => (
        <button
            onClick={() =>
                dispatch({
                    type: "tab.insert",
                    tab: {id: "tab-new", title: "New module", data: {kind: "editor", moduleId: "new"}},
                    target: {kind: "root"},
                    placement: "center",
                    windowId: "window-new",
                })
            }
        >
            Add a module
        </button>
    ),
};

const toolbar: LaymanToolbarConfig<ModuleDescriptor> = {
    createTab: () => createLaymanTab("New module", {kind: "editor", moduleId: crypto.randomUUID()}),
    items: [
        {kind: "builtin", id: "new-module", action: "tab.create"},
        {kind: "builtin", id: "maximize", action: "window.maximize"},
        {kind: "builtin", id: "float", action: "window.float"},
        {kind: "builtin", id: "close", action: "window.close"},
        {kind: "builtin", id: "split-below", action: "window.split.bottom", placement: "overflow"},
        {kind: "builtin", id: "split-right", action: "window.split.right", placement: "overflow"},
        {
            kind: "custom",
            id: "module-count",
            placement: "overflow",
            render: ({context}) => <span data-layman-toolbar-item="module-count">{context.window.tabs.length} modules</span>,
        },
    ],
    overflow: "auto",
};

export default function App() {
    const [state, setState] = useState<LaymanState<ModuleDescriptor>>({layout: initialLayout, floatingWindows: []});
    const [showTabs, setShowTabs] = useState(true);
    const [maxDepth, setMaxDepth] = useState(4);
    const [mutable, setMutable] = useState(true);
    const controller = useLaymanController({state, onStateChange: setState});

    return (
        <div style={{color: "#cdd6f4", backgroundColor: "#232634", height: "100vh"}}>
            <FloatingPanel title="Layman Controls">
                <Toggle checked={mutable} onCheck={() => setMutable(!mutable)} spanText="Mutable" />
                <Toggle checked={showTabs} onCheck={() => setShowTabs(!showTabs)} spanText="Show tabs" />
                <NumberStepper label="Max depth" value={maxDepth} onChange={setMaxDepth} min={1} max={10} />
                <Button onClick={() => controller.dispatch({type: "layout.autoArrange"})}>Auto arrange</Button>
            </FloatingPanel>
            <LaymanView
                controller={controller}
                config={{viewId: "demo-workspace", ariaLabel: "Demo workspace", maxDepth, showTabs, interaction: {mutable}, toolbar}}
                components={components}
            />
        </div>
    );
}
