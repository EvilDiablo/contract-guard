# Changelog

All notable changes to ContractGuard are documented in this file.

## [0.2.1] — 2026-07-23

### Fixed

- Directory compare no longer treats `capture`’s `manifest.json` as an API sample; when a manifest is present, only listed snapshot files are loaded

## [0.2.0] — 2026-07-23

### Added

- Multi-sample schema inference: `normalizeValues`, `compareJsonSamples`, and `loadJsonSamples`
- CLI / Action `-b` / `-c` accept a JSON file or a directory of `*.json` samples (merged before diff)
- Snapshot lifecycle docs (`docs/lifecycle.md`)
- Report footnotes for baseline/candidate sample counts; Action outputs `baseline-samples` / `candidate-samples`

### Changed

- Removing an optional field (not required in the inferred baseline schema) is **info**, not breaking

## [0.1.1] — 2026-07-22

### Added

- Package READMEs for `@contractguard/core` and `@contractguard/cli` (shown on npm)

## [0.1.0] — 2026-07-22

### Added

- `@contractguard/core` — semantic JSON SchemaIR normalize, diff, ignore paths, rename hints, Markdown/JSON reports, capture, TypeScript/Zod codegen
- `@contractguard/cli` — `contractguard compare | capture | generate` with exit codes `0` / `1` / `2`
- GitHub Action (`packages/github-action`) — sticky PR comments, job summary, committed `dist/` bundle
- Config via `contractguard.config.json` / `.contractguardrc`
- Example fixtures, sample workflow, and MVP smoke suite (`pnpm mvp:smoke`)
