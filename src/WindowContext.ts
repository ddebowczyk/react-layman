import {createContext, useContext} from "react";
import {createLaymanTab} from "./createLaymanTab";
import {WindowProps} from "./types";

export const WindowContext = createContext<WindowProps>({
    position: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    },
    path: [],
    tab: createLaymanTab("", {}),
    isSelected: false,
});

export const useWindowContext = () => useContext(WindowContext);
