import { BackendFactory, DragDropManager } from 'dnd-core';
/** Chooses how a Layman view connects to React DnD. */
export type LaymanDndConfig = {
    mode: "internal";
    backend?: BackendFactory;
    context?: unknown;
    options?: unknown;
} | {
    mode: "external";
} | {
    mode: "manager";
    manager: DragDropManager;
};
