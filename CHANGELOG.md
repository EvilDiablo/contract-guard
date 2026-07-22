# Changelog

All notable changes to ContractGuard are documented in this file.

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
