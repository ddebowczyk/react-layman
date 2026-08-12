import type {LaymanToolbarConfig} from "./types";

/** Conservative controls for hosts that do not configure a toolbar. */
export const defaultLaymanToolbar: LaymanToolbarConfig = {
    items: [
        {kind: "builtin", id: "maximize", action: "window.maximize"},
        {kind: "builtin", id: "float", action: "window.float"},
        {kind: "builtin", id: "close", action: "window.close"},
    ],
    overflow: "never",
};
