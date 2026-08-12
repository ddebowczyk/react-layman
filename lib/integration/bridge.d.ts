import { JsonValue } from '../core/model';
import { LaymanWorkspaceBridge, LaymanWorkspaceBridgeOptions } from './types';
/**
 * Coordinates one controller with an application-owned persistence and module
 * host. The bridge has no Tauri imports; a Tauri view supplies the two ports.
 */
export declare function createLaymanWorkspaceBridge<TData extends JsonValue>(options: LaymanWorkspaceBridgeOptions<TData>): LaymanWorkspaceBridge<TData>;
