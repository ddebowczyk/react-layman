/**
 * Creates an identifier that is safe to persist in a Layman snapshot.
 *
 * Tauri webviews provide Web Crypto. The fallback keeps server rendering and
 * restricted test environments usable without making identity generation a
 * global side effect.
 */
export declare function createLaymanId(): string;
