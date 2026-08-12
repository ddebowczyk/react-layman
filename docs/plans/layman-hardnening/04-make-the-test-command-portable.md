# PR 04: Make the test command portable

**Depends on:** PRs 00-03 may merge in any order after their tests pass

## Goal and outcome

Make a clean `npm ci && npm test` run work on supported Node versions without
an undocumented process flag.

The outcome is a trustworthy local and CI test command before the project adds
component, drag, and Tauri-contract tests.

## Confirmed problem

On the current Node 26 runtime, `npm test` emits a localStorage warning and
all persistence tests fail because `window.localStorage` is unavailable. The
suite passes only after an external `--localstorage-file` workaround. A package
test script must not depend on that machine-specific condition.

## Change scope

1. Add an explicit Vitest setup file with an in-memory `Storage` implementation
   or a controlled jsdom storage replacement. It must implement the browser
   methods used by the tests and reset between tests.
2. Configure `vitest.config.ts` to load that setup file. Set a stable jsdom URL
   if the selected storage implementation requires an origin.
3. Add a test that proves isolated tests do not see a previous test's storage
   values.
4. State the supported Node range in `package.json` and CI. Do not bake a
   local Node flag into the `test` script.

## Validation

Run these from a fresh dependency install:

```sh
npm ci
npm test
npm run lint
npm run build:lib
```

The PR is complete only if `npm test` passes without `NODE_OPTIONS`.

## Proposed pull request

**Title:** `test: make localStorage tests independent of Node runtime flags`

**Why:** The current green result depends on a hidden local setup detail.

**What it solves:** Contributors and a Tauri application repository can run
the same unit suite in CI and locally with one documented command.

**Review boundary:** Test-environment setup only. Production persistence
injection is deliberately deferred to PR 13.
