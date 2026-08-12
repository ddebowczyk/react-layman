import type {CSSProperties} from "react";

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

type ThemeToken = keyof LaymanTheme;

const cssVariableByToken: Record<ThemeToken, `--layman-${string}`> = {
    separatorThickness: "--layman-separator-thickness",
    separatorHandleColor: "--layman-separator-handle-color",
    separatorHandleLength: "--layman-separator-handle-length",
    toolbarHeight: "--layman-toolbar-height",
    toolbarBackground: "--layman-toolbar-background",
    toolbarHoverBackground: "--layman-toolbar-hover-background",
    toolbarButtonHoverBackground: "--layman-toolbar-button-hover-background",
    windowBackground: "--layman-window-background",
    tabTextColor: "--layman-tab-text-color",
    tabFontSize: "--layman-tab-font-size",
    closeTabColor: "--layman-close-tab-color",
    accentColor: "--layman-accent-color",
    indicatorThickness: "--layman-indicator-thickness",
    borderRadius: "--layman-border-radius",
    floatingShadow: "--layman-floating-shadow",
    dockZoneInset: "--layman-dock-zone-inset",
    floatingResizeHandleSize: "--layman-floating-resize-handle-size",
    motionDuration: "--layman-motion-duration",
};

const lengthTokens = new Set<ThemeToken>([
    "separatorThickness",
    "separatorHandleLength",
    "toolbarHeight",
    "tabFontSize",
    "indicatorThickness",
    "borderRadius",
    "dockZoneInset",
    "floatingResizeHandleSize",
]);

function cssValue(token: ThemeToken, value: string | number): string {
    return typeof value === "number" && lengthTokens.has(token) ? `${value}px` : String(value);
}

/** Converts the public token names to private, root-scoped CSS variables. */
export function laymanThemeStyle(theme?: LaymanTheme): CSSProperties {
    if (!theme) return {};

    const style: Record<string, string> = {};
    for (const token of Object.keys(cssVariableByToken) as ThemeToken[]) {
        const value = theme[token];
        if (value !== undefined) style[cssVariableByToken[token]] = cssValue(token, value);
    }
    return style as CSSProperties;
}
