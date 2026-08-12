import type {JsonValue} from "../core/model";
import {builtinToolbarWidgetProps, type ToolbarActionRuntime} from "./builtinActions";
import type {
    LaymanCustomToolbarItem,
    LaymanToolbarConfig,
    LaymanToolbarContext,
    LaymanToolbarItem,
    LaymanToolbarItemState,
    LaymanToolbarSurface,
    LaymanToolbarWidgetProps,
} from "./types";

function hasPlacement<TData extends JsonValue>(item: LaymanToolbarItem<TData>, surface: LaymanToolbarSurface): boolean {
    if (surface === "compact") return true;
    const placement = item.placement ?? "bar";
    return placement === "both" || placement === surface;
}

function customWidgetProps<TData extends JsonValue>(
    item: LaymanCustomToolbarItem<TData>,
    context: LaymanToolbarContext<TData>
): LaymanToolbarWidgetProps<TData> {
    const state: LaymanToolbarItemState = {visible: true, disabled: false};
    return {context, item, state, invoke: () => undefined};
}

/** Resolves one host toolbar list and rejects unstable item identities early. */
export function resolveToolbarItems<TData extends JsonValue>(
    config: LaymanToolbarConfig<TData>,
    context: LaymanToolbarContext<TData>
): readonly LaymanToolbarItem<TData>[] {
    const items = typeof config.items === "function" ? config.items(context) : config.items;
    const ids = new Set<string>();
    for (const item of items) {
        if (!item.id.trim()) throw new Error("[Layman] toolbar item id must not be empty");
        if (ids.has(item.id)) throw new Error(`[Layman] duplicate toolbar item id '${item.id}'`);
        ids.add(item.id);
    }
    return items;
}

export function toolbarItemProps<TData extends JsonValue>(
    item: LaymanToolbarItem<TData>,
    runtime: ToolbarActionRuntime<TData>
): LaymanToolbarWidgetProps<TData> {
    return item.kind === "builtin" ? builtinToolbarWidgetProps(item, runtime) : customWidgetProps(item, runtime.context);
}

export function toolbarItemsForSurface<TData extends JsonValue>(
    items: readonly LaymanToolbarItem<TData>[],
    runtime: ToolbarActionRuntime<TData>,
    surface: LaymanToolbarSurface
): readonly LaymanToolbarItem<TData>[] {
    return items.filter((item) => hasPlacement(item, surface) && toolbarItemProps(item, runtime).state.visible);
}

export function hasToolbarSurfaceItems<TData extends JsonValue>(
    items: readonly LaymanToolbarItem<TData>[],
    runtime: ToolbarActionRuntime<TData>,
    surface: LaymanToolbarSurface
): boolean {
    return toolbarItemsForSurface(items, runtime, surface).length > 0;
}
