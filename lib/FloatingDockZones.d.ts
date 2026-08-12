/**
 * Renders the 5 floating-window dock zones - the 4 root edges plus the
 * dynamic "hovered tiled window" center zone - but only while a floating
 * window's whole-window drag is in progress. Detection is derived entirely
 * from the react-dnd monitor (no extra context state needed): a window drag
 * item is currently being dragged whose source address is a floating
 * window's.
 *
 * Mounted once in `Layman.tsx`, inside `.layman-root`, so positions here are
 * container-relative like every other in-root component.
 */
export declare function FloatingDockZones(): import("react").JSX.Element | null;
