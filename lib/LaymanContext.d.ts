import { default as React } from 'react';
import { LaymanCommand } from './core/commands';
import { LaymanInspection } from './core/inspection';
import { LaymanControllerTransition } from './controller/types';
import { LaymanDndConfig } from './dnd/types';
import { LaymanToolbarConfig } from './toolbar/types';
import { LaymanContextType, LaymanState, PaneRenderer, TabRenderer } from './types';
import { LaymanToolbarFrameProps } from './view/types';
interface LaymanRuntimeProps {
    state: LaymanState;
    inspection: LaymanInspection;
    dispatch(command: LaymanCommand): LaymanControllerTransition;
    canExecute: LaymanContextType["canExecute"];
    renderPane: PaneRenderer;
    renderTab: TabRenderer;
    renderNull: () => React.ReactElement;
    dnd?: LaymanDndConfig;
    maxDepth: number;
    showTabs: boolean;
    toolbar?: LaymanToolbarConfig;
    viewId: string;
    ariaLabel?: string;
    rootClassName?: string;
    rootStyle?: React.CSSProperties;
    renderToolbarFrame?: (props: LaymanToolbarFrameProps) => React.ReactNode;
    children: React.ReactNode;
}
/** Internal React runtime. Public hosts use LaymanView. */
export declare const LaymanRuntime: ({ state, inspection, dispatch, renderPane, renderTab, renderNull, canExecute, dnd, maxDepth, showTabs, toolbar, viewId, ariaLabel, rootClassName, rootStyle, renderToolbarFrame, children, }: LaymanRuntimeProps) => React.JSX.Element;
export declare const LaymanContext: React.Context<LaymanContextType>;
export {};
