import { LaymanTab, Position } from './types';
interface WindowMenuProps {
    windowId: string;
    position: Position;
    tabs: readonly LaymanTab[];
    selectedTabId: string | null;
    open: boolean;
    setOpen: (open: boolean) => void;
    controls: React.ReactNode;
}
/**
 * Compact window controls used when `showTabs` is false. Renders a single
 * square ellipsis button in the window's top-right corner. The supplied
 * toolbar configuration defines the entire control set in its popover.
 */
export declare function WindowMenu({ windowId, position, tabs, selectedTabId, open, setOpen, controls }: WindowMenuProps): import("react").JSX.Element;
export {};
