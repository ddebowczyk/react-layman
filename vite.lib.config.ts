import {defineConfig} from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dts from "vite-plugin-dts";

function injectLibraryStyles() {
    return {
        name: "inject-library-styles",
        generateBundle(_: unknown, bundle: Record<string, {type: string; code?: string}>) {
            const entry = bundle["react-layman.js"];
            if (entry?.type !== "chunk" || entry.code === undefined) {
                throw new Error("[Layman] expected the library entry chunk at react-layman.js");
            }
            entry.code = `import "./index.css";\n${entry.code}`;
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        dts({
            include: ["src"],
            outDir: "lib",
        }),
        injectLibraryStyles(),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            formats: ["es"],
        },
        rollupOptions: {
            external: [
                "react",
                "react-dom",
                "react-dnd",
                "react-dnd-html5-backend",
                "react/jsx-runtime",
                "react/jsx-dev-runtime",
            ],
            output: {
                // Git dependencies cannot rely on a consumer running build
                // scripts. Preserve the source module boundaries so the
                // tracked distribution remains inspectable and small.
                preserveModules: true,
                preserveModulesRoot: "src",
                entryFileNames: (chunk) => (chunk.name === "index" ? "react-layman.js" : "[name].js"),
                assetFileNames: "index[extname]",
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                },
            },
        },
        outDir: "lib",
        // Ensure CSS is emitted
        cssCodeSplit: true,
        copyPublicDir: false,
    },
});
