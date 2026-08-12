# PR 14: Document, migrate, and release the public contract

**Depends on:** PRs 00-13

## Goal and outcome

Ship the new foundations as a coherent, discoverable public API. A consumer
must be able to migrate from `LaymanProvider` and raw actions to a controlled
view without reading internal source files.

The outcome is a release an upstream author can accept, revise, or split with
clear compatibility and verification evidence.

## Change scope

1. Rewrite the README around the supported entry points:
   setup, controlled state, controller commands, inspection, components, DnD,
   themes, persistence, and the Tauri guide.
2. Add a migration guide from `initialLayout`, `TabData`, `LaymanPath`, raw
   `layoutDispatch`, `storageKey`, and global CSS variables. Include a before
   and after TypeScript example.
3. Publish an API reference generated or checked from the exported types. It
   must state which APIs are stable, deprecated, experimental, or private.
4. Document state schema versions, migration behavior, transition/rejection
   semantics, revision rules, and the no-op identity guarantee.
5. Add changelog and release notes that list each defect repair separately from
   the new controlled API. Choose versioning deliberately:
   preserve a compatibility layer for a minor v0.x release, or publish a major
   release if legacy types are removed. Do not call a breaking data-model change
   a patch release.
6. Add an `npm pack --dry-run` check and a consumer type-check fixture that
   imports only the package's documented exports. Confirm declarations and CSS
   files needed by the public API are included.

## Release gates

Before publishing, require:

```sh
npm ci
npm test
npm run lint
npm run build:lib
npm pack --dry-run
```

Also run the Tauri TypeScript example and the consumer application's native
acceptance scenario from PR 13. Record the Node and Tauri versions used.

## Proposed pull request

**Title:** `docs: publish Layman controlled-view migration and release contract`

**Why:** The current README documents raw reducer dispatch and does not fully
describe current floating behavior. A new API is only usable if its contract is
clear and package-safe.

**What it solves:** Upstream users and the Tauri application team can adopt the
same stable API, understand migration risk, and reproduce the validation gates.

**Review boundary:** Documentation, package verification, and release metadata.
Do not hide late functional changes in this final PR.
