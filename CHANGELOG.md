# Changelog

All notable changes to this project are documented in this file.

## [0.5.0] - Unreleased

### React compatibility

- Require React and React DOM 19. React 18 is no longer a supported host.

### Test runtime

- Import test `act` from `react`, as required by React 19.

## [0.4.0] - Unreleased

### Breaking

- Replace the v0.3 provider, context, reducer, and path-based API with the
  controlled view and stable-ID command API.
- Remove `LaymanProvider`, `Layman`, `TabData`, `LaymanPath`, React contexts,
  raw reducer actions, browser `storageKey` persistence, and global theme
  control. There are no compatibility aliases or deprecated exports.
- Require snapshot schema version `2`. Older data must be migrated by the
  application before it calls `deserializeState`.

### Added

- Add the pure validated layout engine, detached inspection, controller,
  interaction policy, configurable toolbar widgets, DnD host configuration,
  scoped themes, component slots, and Tauri workspace bridge.
- Add a package-consumer declaration fixture and packed-file verification.

### Fixed

- Reject invalid window addresses and invalid tab commands before mutation.
- Make tab and window moves atomic.
- Make the test command portable and add repeatable interaction tests.
- Isolate state, metrics, theme tokens, and DnD behavior between views.
- Reject malformed snapshots and preserve identity for no-op and rejected
  transitions.

[0.5.0]: https://github.com/Jeshwin/react-layman/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Jeshwin/react-layman/compare/v0.3.0...v0.4.0
