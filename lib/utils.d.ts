import { FloatingWindowAddress, WindowAddress } from './types';
/**
 * Narrows a `WindowAddress` to a floating-window address. A `WindowAddress`
 * is either a tree `LaymanPath` (a plain number array) or a
 * `FloatingWindowAddress` (`{floatingId}`), so a simple array check
 * distinguishes the two.
 */
export declare function isFloatingAddress(address: WindowAddress): address is FloatingWindowAddress;
/** A stable string key/DOM id for a window address, tree or floating. */
export declare function addressKey(address: WindowAddress): string;
/**
 * Recursively deep-clones a value.
 *
 * Supports the data shapes used by a layman layout: primitives, plain objects,
 * arrays, `Date`/`RegExp`, and custom object instances. Object prototypes are
 * preserved so clones retain the semantics of their input values.
 */
export declare function deepClone<T>(value: T): T;
/**
 * Recursively compares two values for structural (deep) equality.
 *
 * Handles primitives, arrays, `Date`/`RegExp`, and plain/keyed objects.
 * `NaN` is treated as equal to itself.
 */
export declare function deepEqual(a: unknown, b: unknown): boolean;
