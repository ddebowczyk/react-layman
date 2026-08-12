/**
 * Creates an identifier that is safe to persist in a Layman snapshot.
 *
 * Tauri webviews provide Web Crypto. The fallback keeps server rendering and
 * restricted test environments usable without making identity generation a
 * global side effect.
 */
export function createLaymanId(): string {
    const randomUUID = globalThis.crypto?.randomUUID;
    if (randomUUID) return randomUUID.call(globalThis.crypto);

    return `layman-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
