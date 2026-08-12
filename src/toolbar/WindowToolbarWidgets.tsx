import {Fragment} from "react";
import type {JsonValue} from "../core/model";
import type {ToolbarActionRuntime} from "./builtinActions";
import {LaymanToolbarButton} from "./LaymanToolbarButton";
import {toolbarItemProps, toolbarItemsForSurface} from "./items";
import type {LaymanToolbarItem, LaymanToolbarSurface} from "./types";

interface WindowToolbarWidgetsProps<TData extends JsonValue> {
    items: readonly LaymanToolbarItem<TData>[];
    runtime: ToolbarActionRuntime<TData>;
    surface: LaymanToolbarSurface;
}

/** Renders declarative host items on one toolbar surface in declared order. */
export function WindowToolbarWidgets<TData extends JsonValue>({items, runtime, surface}: WindowToolbarWidgetsProps<TData>) {
    return (
        <>
            {toolbarItemsForSurface(items, runtime, surface).map((item) => {
                const props = toolbarItemProps(item, runtime);
                const node = item.kind === "builtin" ? item.render?.(props) ?? <LaymanToolbarButton {...props} /> : item.render(props);
                return <Fragment key={item.id}>{node}</Fragment>;
            })}
        </>
    );
}
