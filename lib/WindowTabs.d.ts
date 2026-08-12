import { ConnectDragSource } from 'react-dnd';
import { LaymanTab, WindowAddress } from './types';
interface TabProps {
    tab: LaymanTab;
    windowId: string;
    path: WindowAddress;
    isSelected: boolean;
    onSelect: React.MouseEventHandler<HTMLButtonElement>;
    onDelete: React.MouseEventHandler<HTMLButtonElement>;
}
export declare const Tab: ({ tab, windowId, path, isSelected, onDelete, onSelect }: TabProps) => import("react").JSX.Element;
interface SingleTabProps {
    dragRef: ConnectDragSource;
    tab: LaymanTab;
    windowId: string;
    onDelete: React.MouseEventHandler<HTMLButtonElement>;
    onSelect: React.MouseEventHandler<HTMLButtonElement>;
    onMouseDown: React.MouseEventHandler<HTMLButtonElement>;
}
export declare const SingleTab: ({ dragRef, tab, windowId, onDelete, onMouseDown, onSelect }: SingleTabProps) => import("react").JSX.Element;
export {};
