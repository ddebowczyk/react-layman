import {createLaymanNode, createLaymanTab, createLaymanWindow, type LaymanLayout} from "../src";
import type {ModuleDescriptor} from "./modules";

export const initialLayout: LaymanLayout<ModuleDescriptor> = createLaymanNode(
    "row",
    [
        createLaymanNode(
            "column",
            [
                createLaymanWindow(
                    [
                        createLaymanTab<ModuleDescriptor>("Home", {kind: "dashboard", moduleId: "home"}, "tab-home"),
                        createLaymanTab<ModuleDescriptor>("Settings", {kind: "settings", moduleId: "settings"}, "tab-settings"),
                    ],
                    "window-home",
                    "tab-home"
                ),
                createLaymanWindow(
                    [
                        createLaymanTab<ModuleDescriptor>("Profile", {kind: "profile", moduleId: "profile"}, "tab-profile"),
                        createLaymanTab<ModuleDescriptor>("Messages", {kind: "editor", moduleId: "messages"}, "tab-messages"),
                    ],
                    "window-profile",
                    "tab-messages"
                ),
            ],
            "split-left"
        ),
        createLaymanWindow(
            [createLaymanTab<ModuleDescriptor>("Dashboard", {kind: "dashboard", moduleId: "dashboard"}, "tab-dashboard")],
            "window-dashboard"
        ),
    ],
    "split-root"
);
