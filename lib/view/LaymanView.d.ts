import { CSSProperties } from 'react';
import { JsonValue } from '../core/model';
import { LaymanController } from '../controller/types';
import { LaymanComponents, LaymanViewConfig } from './types';
export interface LaymanViewProps<TData extends JsonValue> {
    controller: LaymanController<TData>;
    config: LaymanViewConfig<TData>;
    components: LaymanComponents<TData>;
    className?: string;
    style?: CSSProperties;
}
/** Renders a controlled Layman workspace through the public controller contract. */
export declare function LaymanView<TData extends JsonValue>({ controller, config, components, className, style }: LaymanViewProps<TData>): import("react").JSX.Element;
