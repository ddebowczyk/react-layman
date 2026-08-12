import { JsonValue } from '../core/model';
import { LaymanToolbarWidgetProps } from './types';
/** The optional default visual for a declarative built-in toolbar action. */
export declare function LaymanToolbarButton<TData extends JsonValue>({ item, state, invoke }: LaymanToolbarWidgetProps<TData>): import("react").JSX.Element | null;
