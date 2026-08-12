import {useMemo, useSyncExternalStore} from "react";
import type {CSSProperties} from "react";
import type {LaymanCommand} from "../core/commands";
import type {JsonValue, LaymanState, LaymanTab} from "../core/model";
import {LaymanRuntime} from "../LaymanContext";
import {LaymanCanvas} from "../Layman";
import type {LaymanCommandAuthorizer, LaymanCommandDispatcher, LaymanController} from "../controller/types";
import type {LaymanToolbarConfig} from "../toolbar/types";
import type {LaymanComponents, LaymanToolbarFrameProps, LaymanViewConfig} from "./types";
import {laymanThemeStyle} from "./theme";

export interface LaymanViewProps<TData extends JsonValue> {
    controller: LaymanController<TData>;
    config: LaymanViewConfig<TData>;
    components: LaymanComponents<TData>;
    className?: string;
    style?: CSSProperties;
}

function useControllerState<TData extends JsonValue>(controller: LaymanController<TData>): Readonly<LaymanState<TData>> {
    return useSyncExternalStore(
        (notify) => controller.subscribe(() => notify()),
        () => controller.getState(),
        () => controller.getState()
    );
}

function requireViewId(viewId: unknown): asserts viewId is string {
    if (typeof viewId !== "string" || viewId.trim().length === 0) {
        throw new Error("[Layman] viewId must be a non-empty string");
    }
}

/** Renders a controlled Layman workspace through the public controller contract. */
export function LaymanView<TData extends JsonValue>({controller, config, components, className, style}: LaymanViewProps<TData>) {
    requireViewId(config.viewId);
    const state = useControllerState(controller);
    const inspection = controller.inspect();
    const {Pane, Tab, Empty, ToolbarFrame} = components;
    const view = {viewId: config.viewId, maxDepth: config.maxDepth ?? Infinity, showTabs: config.showTabs ?? true};
    const rootStyle = useMemo(() => ({...laymanThemeStyle(config.theme), ...style}), [config.theme, style]);
    const dispatch: LaymanCommandDispatcher<TData> = (command) => {
        return controller.dispatch(command, {origin: "user", view});
    };
    const canExecute: LaymanCommandAuthorizer<TData> = (command) => controller.canExecute(command, {origin: "user", view});

    return (
        <LaymanRuntime
            state={state as LaymanState}
            inspection={inspection}
            dispatch={(command) => dispatch(command as LaymanCommand<TData>)}
            canExecute={(command) => canExecute(command as LaymanCommand<TData>)}
            renderPane={(tab, windowId, selected) => (
                <Pane
                    tab={tab as LaymanTab<TData>}
                    windowId={windowId}
                    selected={selected}
                    controller={controller}
                    dispatch={dispatch}
                />
            )}
            renderTab={(tab, windowId, selected) => (
                <Tab
                    tab={tab as LaymanTab<TData>}
                    windowId={windowId}
                    selected={selected}
                    controller={controller}
                    dispatch={dispatch}
                />
            )}
            renderNull={() => (
                <div className="layman-empty" data-layman-component="empty">
                    {Empty ? <Empty controller={controller} dispatch={dispatch} /> : "No windows"}
                </div>
            )}
            dnd={config.dnd}
            maxDepth={view.maxDepth}
            showTabs={view.showTabs}
            toolbar={config.toolbar as LaymanToolbarConfig | undefined}
            viewId={config.viewId}
            ariaLabel={config.ariaLabel}
            rootClassName={className}
            rootStyle={rootStyle}
            renderToolbarFrame={(props) =>
                ToolbarFrame ? <ToolbarFrame {...(props as LaymanToolbarFrameProps<TData>)} /> : props.children
            }
        >
            <LaymanCanvas />
        </LaymanRuntime>
    );
}
