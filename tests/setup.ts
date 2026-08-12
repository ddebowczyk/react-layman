import {cleanup} from "@testing-library/react";
import {afterEach, beforeEach, vi} from "vitest";

export interface TestRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

class MemoryStorage implements Storage {
    private readonly values = new Map<string, string>();

    get length() {
        return this.values.size;
    }

    clear() {
        this.values.clear();
    }

    getItem(key: string) {
        return this.values.get(key) ?? null;
    }

    key(index: number) {
        return [...this.values.keys()][index] ?? null;
    }

    removeItem(key: string) {
        this.values.delete(key);
    }

    setItem(key: string, value: string) {
        this.values.set(key, value);
    }
}

let elementRects = new WeakMap<Element, TestRect>();

function domRect({top, left, width, height}: TestRect): DOMRect {
    return {
        top,
        left,
        width,
        height,
        x: left,
        y: top,
        right: left + width,
        bottom: top + height,
        toJSON: () => ({}),
    } as DOMRect;
}

/** Sets a deterministic bounding rectangle for one element. */
export function setElementRect(element: Element, rect: TestRect) {
    elementRects.set(element, rect);
}

/** Returns the deterministic rectangle used by the browser-test runtime. */
export function getElementRect(element: Element): TestRect {
    return elementRects.get(element) ?? {top: 0, left: 0, width: 0, height: 0};
}

/** A controllable ResizeObserver with lifecycle evidence for isolation tests. */
export class TestResizeObserver {
    static readonly instances: TestResizeObserver[] = [];
    readonly targets = new Set<Element>();
    readonly disconnect = vi.fn(() => this.targets.clear());

    constructor(private readonly callback: ResizeObserverCallback) {
        TestResizeObserver.instances.push(this);
    }

    observe = vi.fn((target: Element) => {
        this.targets.add(target);
    });

    unobserve = vi.fn((target: Element) => {
        this.targets.delete(target);
    });

    static emit(target: Element) {
        const entry = {target, contentRect: domRect(getElementRect(target))} as ResizeObserverEntry;
        for (const observer of TestResizeObserver.instances) {
            if (observer.targets.has(target)) observer.callback([entry], observer as unknown as ResizeObserver);
        }
    }

    static reset() {
        TestResizeObserver.instances.splice(0);
    }
}

beforeEach(() => {
    elementRects = new WeakMap();
    Object.defineProperty(window, "localStorage", {configurable: true, value: new MemoryStorage()});
    Object.defineProperty(window, "sessionStorage", {configurable: true, value: new MemoryStorage()});
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
        return domRect(getElementRect(this));
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    if (globalThis.crypto?.randomUUID) {
        let nextId = 0;
        vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => `test-uuid-${++nextId}`);
    }
});

afterEach(() => {
    cleanup();
    TestResizeObserver.reset();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});
