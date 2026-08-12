import {useSyncExternalStore} from "react";
import type {LaymanCommand} from "../core/commands";
import type {JsonValue, LaymanState, LaymanTab} from "../core/model";
import {LaymanRuntime} from "../LaymanContext";
import {LaymanCanvas} from "../Layman";
import type {LaymanCommandDispatcher, LaymanController} from "../controller/types";
import type {LaymanToolbarConfig} from "../toolbar/types";
import type {LaymanComponents, LaymanViewConfig} from "./types";

export interface LaymanViewProps<TData extends JsonValue> {
    controller: LaymanController<TData>;
    config: LaymanViewConfig<TData>;
    components: LaymanComponents<TData>;
}

function useControllerState<TData extends JsonValue>(controller: LaymanController<TData>): Readonly<LaymanState<TData>> {
    return useSyncExternalStore(
        (notify) => controller.subscribe(() => notify()),
        () => controller.getState(),
        () => controller.getState()
    );
}

/** Renders a controlled Layman workspace through the public controller contract. */
export function LaymanView<TData extends JsonValue>({controller, config, components}: LaymanViewProps<TData>) {
    const state = useControllerState(controller);
    const inspection = controller.inspect();
    const {Pane, Tab, Empty} = components;
    const dispatch: LaymanCommandDispatcher<TData> = (command) => {
        return controller.dispatch(command, {
            origin: "user",
            allowed: config.interaction?.canExecute?.(command) ?? true,
        });
    };

    return (
        <LaymanRuntime
            state={state as LaymanState}
            inspection={inspection}
            dispatch={(command) => dispatch(command as LaymanCommand<TData>)}
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
            renderNull={() =>
                Empty ? <Empty controller={controller} dispatch={dispatch} /> : <div className="layman-empty">No windows</div>
            }
            mutable={config.interaction?.mutable ?? true}
            maxDepth={config.maxDepth ?? Infinity}
            showTabs={config.showTabs ?? true}
            toolbar={config.toolbar as LaymanToolbarConfig | undefined}
            viewId={config.viewId}
            ariaLabel={config.ariaLabel}
        >
            <LaymanCanvas />
        </LaymanRuntime>
    );
}
