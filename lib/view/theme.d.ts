import { CSSProperties } from 'react';
type LaymanLength = number | string;
/**
 * Visual tokens applied only to one Layman view root. Numeric length values
 * are converted to pixels; string values may use any valid CSS length.
 */
export interface LaymanTheme {
    separatorThickness?: LaymanLength;
    separatorHandleColor?: string;
    separatorHandleLength?: LaymanLength;
    toolbarHeight?: LaymanLength;
    toolbarBackground?: string;
    toolbarHoverBackground?: string;
    toolbarButtonHoverBackground?: string;
    windowBackground?: string;
    tabTextColor?: string;
    tabFontSize?: LaymanLength;
    closeTabColor?: string;
    accentColor?: string;
    indicatorThickness?: LaymanLength;
    borderRadius?: LaymanLength;
    floatingShadow?: string;
    dockZoneInset?: LaymanLength;
    floatingResizeHandleSize?: LaymanLength;
    motionDuration?: string;
}
/** Converts the public token names to private, root-scoped CSS variables. */
export declare function laymanThemeStyle(theme?: LaymanTheme): CSSProperties;
export {};
