import {LaymanState} from "./types";
import {deserializeState, serializeState} from "./Serializer";

export function loadState(storageKey: string | undefined, fallback: LaymanState): LaymanState {
    if (!storageKey || typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw === null) return fallback;
        return deserializeState(JSON.parse(raw));
    } catch (err) {
        console.warn("[Layman] failed to restore layout, using initialLayout", err);
        return fallback;
    }
}

export function saveState(storageKey: string | undefined, state: LaymanState): void {
    if (!storageKey || typeof window === "undefined") return;
    try {
        window.localStorage.setItem(
            storageKey,
            JSON.stringify(serializeState(state))
        );
    } catch (err) {
        console.warn("[Layman] failed to save layout", err);
    }
}
