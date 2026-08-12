import {createLaymanNode, createLaymanTab, createLaymanWindow} from "../src";

export const initialLayout = createLaymanNode(
    "row",
    [
        createLaymanNode(
            "column",
            [
                createLaymanWindow(
                    [createLaymanTab("Home", {icon: "home-icon"}, "tab-home"), createLaymanTab("Settings", {icon: "settings-icon"}, "tab-settings")],
                    "window-home",
                    "tab-home"
                ),
                createLaymanWindow(
                    [createLaymanTab("Profile", {icon: "profile-icon"}, "tab-profile"), createLaymanTab("Messages", {icon: "messages-icon"}, "tab-messages")],
                    "window-profile",
                    "tab-messages"
                ),
            ],
            "split-left"
        ),
        createLaymanWindow([createLaymanTab("Dashboard", {icon: "dashboard-icon"}, "tab-dashboard")], "window-dashboard"),
    ],
    "split-root"
);
