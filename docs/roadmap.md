# Roadmap

Public product plans for ContractGuard. (Private business notes stay outside this repo — see gitignored `local/`.)

## Shipped (0.1.x)

- Semantic JSON compare (SchemaIR)
- CLI: `compare`, `capture`, `generate`
- GitHub Action with sticky PR comments
- Config + default ignore paths
- Docs + `pnpm mvp:smoke`
- npm packages `@contractguard/core` and `@contractguard/cli`

## Shipped (0.2.0 — next publish)

- **Multi-sample inference** — `-b` / `-c` (and Action inputs) accept a file or directory of `*.json`; schemas merged before diff
- Optional fields from partial presence; removal of non-required fields is not breaking
- Snapshot [lifecycle](lifecycle.md) docs

See [Install](install.md) and [Changelog](../CHANGELOG.md).

## Next

1. **OpenAPI support** — compare OpenAPI YAML/JSON for a path/operation (complementary to JSON samples)
2. **Action packaging polish** — Marketplace listing; clearer pin docs for latest `v*` tag
3. **Capture in CI examples** — staging endpoint snapshots via `contractguard.config.json`
4. **DX** — more fixtures, clearer ignore-path docs, contributor guides

## Later / ideas

- Experimental hosted UI (`apps/web`) for exploring diffs in a browser
- gRPC / protobuf adapters
- Broader schema-drift monitoring beyond REST JSON

## Contributing ideas

Open an issue with your use case, then follow [Contributing](../CONTRIBUTING.md).
