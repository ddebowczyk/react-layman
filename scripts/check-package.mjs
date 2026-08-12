import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function fail(message) {
    throw new Error(`[package-check] ${message}`);
}

function pack() {
    // This metadata check must not execute package lifecycle scripts before it
    // parses npm's JSON response.
    const output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {cwd: root, encoding: "utf8"});
    const result = JSON.parse(output);
    if (!Array.isArray(result) || result.length !== 1 || !Array.isArray(result[0]?.files)) {
        fail("npm pack did not report exactly one package file list");
    }
    return result[0];
}

if (packageJson.exports?.["."]?.types !== "./lib/index.d.ts") fail("root declaration export is missing");
if (packageJson.exports?.["./styles.css"] !== "./lib/index.css") fail("stylesheet export is missing");
if (packageJson.scripts?.prepare) fail("Git source installs must not require a consumer build hook");
for (const [name, range] of Object.entries({react: "^19.0.0", "react-dom": "^19.0.0"})) {
    if (packageJson.peerDependencies?.[name] !== range) fail(`${name} peer dependency must be ${range}`);
}

const packed = pack();
const paths = new Set(packed.files.map((file) => file.path));
const trackedPaths = new Set(execFileSync("git", ["ls-files", "lib"], {cwd: root, encoding: "utf8"}).trim().split("\n"));
for (const required of ["lib/index.d.ts", "lib/index.css", "lib/react-layman.js", "package.json", "README.md", "LICENSE"]) {
    if (!paths.has(required)) fail(`packed file is missing: ${required}`);
}
for (const path of paths) {
    if (path.startsWith("lib/") && !trackedPaths.has(path)) fail(`Git source-install artifact is not tracked: ${path}`);
}

console.log(`[package-check] ${packageJson.name}@${packageJson.version} includes public declarations and stylesheet.`);
