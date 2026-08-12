import {createContext, ReactNode, RefObject, useContext} from "react";

interface LaymanViewContextValue {
    rootRef: RefObject<HTMLDivElement>;
    dragBorderElement: HTMLDivElement | null;
}

const LaymanViewContext = createContext<LaymanViewContextValue | null>(null);

export function LaymanViewScope({
    rootRef,
    dragBorderElement,
    children,
}: LaymanViewContextValue & {children: ReactNode}) {
    return <LaymanViewContext.Provider value={{rootRef, dragBorderElement}}>{children}</LaymanViewContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Internal hook shares the private view context.
export function useLaymanView() {
    const view = useContext(LaymanViewContext);
    if (!view) throw new Error("Layman view components must render inside Layman.");
    return view;
}
