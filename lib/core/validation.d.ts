import { JsonValue, LaymanState, Position } from './model';
export type LaymanValidationIssue = "duplicate-tab-id" | "duplicate-layout-id" | "duplicate-window-id" | "duplicate-split-id" | "empty-id" | "invalid-selection" | "invalid-position" | "invalid-z-index" | "invalid-view-percent" | "invalid-tab-data";
export interface LaymanValidation {
    valid: boolean;
    issues: readonly LaymanValidationIssue[];
}
export declare function isJsonValue(value: unknown, seen?: Set<object>): value is JsonValue;
/** A floating panel needs finite coordinates and a positive visible area. */
export declare function isValidFloatingPosition(value: Position): boolean;
/** A split percentage is optional, but when supplied it must occupy visible space. */
export declare function isValidViewPercent(value: unknown): boolean;
/** Validates the complete state graph without changing it. */
export declare function validateLaymanState<TData extends JsonValue>(state: LaymanState<TData>): LaymanValidation;
