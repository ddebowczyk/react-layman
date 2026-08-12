import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import type {LaymanDndConfig} from "./types";

const internalDnd: LaymanDndConfig = {mode: "internal"};

interface LaymanDndProviderProps {
    config?: LaymanDndConfig;
    children: React.ReactNode;
}

/** Installs the default DnD provider, reuses a host provider, or accepts a test manager. */
export function LaymanDndProvider({config = internalDnd, children}: LaymanDndProviderProps) {
    if (config.mode === "external") return <>{children}</>;
    if (config.mode === "manager") return <DndProvider manager={config.manager}>{children}</DndProvider>;
    return <DndProvider backend={config.backend ?? HTML5Backend} context={config.context} options={config.options}>{children}</DndProvider>;
}
