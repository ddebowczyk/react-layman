import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it} from "vitest";
import {createLaymanController} from "../src/controller";
import {createLaymanTab, createLaymanWindow} from "../src/createLaymanTab";
import {WindowToolbarWidgets} from "../src/toolbar/WindowToolbarWidgets";
import type {ToolbarActionRuntime} from "../src/toolbar/builtinActions";
import {resolveToolbarItems, toolbarItemProps, toolbarItemsForSurface} from "../src/toolbar/items";
import type {LaymanToolbarConfig, LaymanToolbarContext} from "../src/toolbar/types";

interface ModuleData {
    kind: string;
}

function testRuntime(config: LaymanToolbarConfig<ModuleData>, atMaxDepth = false) {
    const editor = createLaymanTab("Editor", {kind: "editor"}, "tab-editor");
    const layout = createLaymanWindow([editor], "window-editor");
    const controller = createLaymanController({state: {layout, floatingWindows: []}});
    const context: LaymanToolbarContext<ModuleData> = {
        viewId: "workspace",
        window: {id: layout.id, tabs: layout.tabs, selectedTabId: layout.selectedTabId, location: "tiled"},
        inspection: controller.inspect(),
        isMaximized: false,
        dispatch: (command) => controller.dispatch(command, {origin: "user"}),
    };
    const runtime: ToolbarActionRuntime<ModuleData> = {
        config,
        context,
        layout,
        rawPosition: {top: 10, left: 20, width: 300, height: 200},
        container: {top: 0, left: 0, width: 800, height: 600},
        atMaxDepth,
        setMaximized: () => undefined,
    };
    return {controller, context, runtime};
}

describe("host-defined toolbar widgets", () => {
    it("uses the declared items exactly and keeps their surface order", () => {
        const config: LaymanToolbarConfig<ModuleData> = {
            items: [
                {kind: "builtin", id: "close", action: "window.close", placement: "bar"},
                {kind: "custom", id: "status", placement: "both", render: () => createElement("span", {"data-widget": "status"}, "Status")},
                {kind: "builtin", id: "split", action: "window.split.right", placement: "overflow"},
            ],
            overflow: "auto",
        };
        const {runtime} = testRuntime(config);
        const items = resolveToolbarItems(config, runtime.context);

        expect(toolbarItemsForSurface(items, runtime, "bar").map((item) => item.id)).toEqual(["close", "status"]);
        expect(toolbarItemsForSurface(items, runtime, "overflow").map((item) => item.id)).toEqual(["status", "split"]);
        expect(toolbarItemsForSurface(items, runtime, "compact").map((item) => item.id)).toEqual(["close", "status", "split"]);

        const markup = renderToStaticMarkup(createElement(WindowToolbarWidgets, {items, runtime, surface: "bar"}));
        expect(markup).toContain('data-layman-toolbar-item="close"');
        expect(markup).toContain('data-widget="status"');
        expect(markup).not.toContain("maximize");
        expect(markup).not.toContain("split");
    });

    it("gives custom widgets a typed, controller-backed command dispatcher", () => {
        let received: LaymanToolbarContext<ModuleData> | undefined;
        const config: LaymanToolbarConfig<ModuleData> = {
            items: [
                {
                    kind: "custom",
                    id: "close-from-host",
                    render: ({context}) => {
                        received = context;
                        return null;
                    },
                },
            ],
        };
        const {controller, runtime} = testRuntime(config);
        const items = resolveToolbarItems(config, runtime.context);
        renderToStaticMarkup(createElement(WindowToolbarWidgets, {items, runtime, surface: "bar"}));

        const transition = received?.dispatch({type: "window.close", windowId: "window-editor"});
        expect(transition).toMatchObject({status: "applied", meta: {origin: "user"}});
        expect(controller.inspect().windows).toEqual([]);
    });

    it("requires a host tab factory and never invents generic tab data", () => {
        const disabledConfig: LaymanToolbarConfig<ModuleData> = {
            items: [{kind: "builtin", id: "new", action: "tab.create"}],
        };
        const disabled = testRuntime(disabledConfig);
        const disabledProps = toolbarItemProps(resolveToolbarItems(disabledConfig, disabled.context)[0], disabled.runtime);
        expect(disabledProps.state).toMatchObject({visible: true, disabled: true, disabledReason: "Toolbar createTab is not configured"});
        expect(disabledProps.invoke()).toBeUndefined();

        const enabledConfig: LaymanToolbarConfig<ModuleData> = {
            createTab: () => createLaymanTab("Terminal", {kind: "terminal"}, "tab-terminal"),
            items: [{kind: "builtin", id: "new", action: "tab.create"}],
        };
        const enabled = testRuntime(enabledConfig);
        const enabledProps = toolbarItemProps(resolveToolbarItems(enabledConfig, enabled.context)[0], enabled.runtime);
        expect(enabledProps.invoke()).toMatchObject({status: "applied"});
        expect(enabled.controller.inspect().windows[0]?.tabs).toEqual([
            {id: "tab-editor", title: "Editor", data: {kind: "editor"}},
            {id: "tab-terminal", title: "Terminal", data: {kind: "terminal"}},
        ]);
    });

    it("hides impossible split controls and rejects unstable item IDs at setup", () => {
        const config: LaymanToolbarConfig<ModuleData> = {
            items: [{kind: "builtin", id: "split", action: "window.split.left"}],
        };
        const depthLimit = testRuntime(config, true);
        const split = toolbarItemProps(resolveToolbarItems(config, depthLimit.context)[0], depthLimit.runtime);
        expect(split.state).toMatchObject({visible: false, disabledReason: "Maximum split depth reached"});

        const invalid = testRuntime({
            items: [
                {kind: "builtin", id: "duplicate", action: "window.close"},
                {kind: "custom", id: "duplicate", render: () => null},
            ],
        });
        expect(() => resolveToolbarItems(invalid.runtime.config, invalid.context)).toThrow("duplicate toolbar item id 'duplicate'");
        expect(() => resolveToolbarItems({items: [{kind: "builtin", id: " ", action: "window.close"}]}, invalid.context)).toThrow(
            "toolbar item id must not be empty"
        );
    });
});
