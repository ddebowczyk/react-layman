import { LaymanDndConfig } from './types';
interface LaymanDndProviderProps {
    config?: LaymanDndConfig;
    children: React.ReactNode;
}
/** Installs the default DnD provider, reuses a host provider, or accepts a test manager. */
export declare function LaymanDndProvider({ config, children }: LaymanDndProviderProps): import("react").JSX.Element;
export {};
