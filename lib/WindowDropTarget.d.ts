import { Position, WindowAddress } from './types';
interface WindowDropTargetProps {
    windowId: string;
    path: WindowAddress;
    position: Position;
    placement: "top" | "left" | "bottom" | "right" | "center";
}
export declare function WindowDropTarget({ windowId, path, position, placement }: WindowDropTargetProps): import("react").JSX.Element | null;
export {};
