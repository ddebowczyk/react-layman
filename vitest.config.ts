import {defineConfig} from "vitest/config";

// Vitest configuration for unit tests (serialization + localStorage persistence).
// Tests live in the root `tests/` folder so they are never emitted into the
// published `lib/` (tsconfig-build.json only includes `src`).
export default defineConfig({
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: {url: "http://layman.test/"},
        },
        globals: true,
        include: ["tests/**/*.test.{ts,tsx}"],
        setupFiles: ["tests/setup.ts"],
    },
});
