import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it, vi} from "vitest";
import {createLaymanController} from "../src/controller";
import {createLaymanTab, createLaymanWindow} from "../src/createLaymanTab";
import {LaymanView} from "../src/view";

describe("LaymanView server rendering", () => {
    it("does not construct a browser Image during render", () => {
        vi.stubGlobal("Image", undefined);
        const selectedTab = createLaymanTab("Server tab", {}, "tab-server");
        const controller = createLaymanController({
            state: {layout: createLaymanWindow([selectedTab], "window-server"), floatingWindows: []},
        });

        expect(() =>
            renderToStaticMarkup(
                <LaymanView
                    controller={controller}
                    config={{viewId: "server-view"}}
                    components={{Pane: ({tab}) => <main>{tab.title}</main>, Tab: ({tab}) => tab.title}}
                />
            )
        ).not.toThrow();
    });
});
