import { LaymanTab, Position, WindowAddress } from './types';
interface UseWindowDragOptions {
    windowId: string;
    path: WindowAddress;
    position: Position;
    tabs: readonly LaymanTab[];
    selectedTabId: string | null;
}
/** Coordinates the two drag handles that can move one window. */
export declare function useWindowDrag({ windowId, path, position, tabs, selectedTabId }: UseWindowDragOptions): {
    currentMousePosition: {
        top: number;
        left: number;
    };
    drag: import('react-dnd').ConnectDragSource;
    dragStartPosition: {
        x: number;
        y: number;
    };
    isDragging: boolean;
    isSingleTabDragging: boolean;
    setDragStartPosition: import('react').Dispatch<import('react').SetStateAction<{
        x: number;
        y: number;
    }>>;
    singleTabDrag: import('react-dnd').ConnectDragSource;
};
export {};
