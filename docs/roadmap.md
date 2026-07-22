# Roadmap

Public product plans for ContractGuard. (Private business notes stay outside this repo — see gitignored `local/`.)

## Shipped (0.1.0)

- Semantic JSON compare (SchemaIR)
- CLI: `compare`, `capture`, `generate`
- GitHub Action with sticky PR comments
- Config + default ignore paths
- Docs + `pnpm mvp:smoke`
- npm packages `@contractguard/core` and `@contractguard/cli`

See [Install](install.md) and [Changelog](../CHANGELOG.md).

## Next

1. **OpenAPI support** — compare OpenAPI YAML/JSON for a path/operation
2. **Action packaging polish** — release workflow on `v*` tags; optional Marketplace listing
3. **Capture in CI examples** — staging endpoint snapshots via `contractguard.config.json`
4. **DX** — more fixtures, clearer ignore-path docs, contributor guides

## Later / ideas

- Experimental hosted UI (`apps/web`) for exploring diffs in a browser
- gRPC / protobuf adapters
- Broader schema-drift monitoring beyond REST JSON

## Contributing ideas

Open an issue with your use case, then follow [Contributing](../CONTRIBUTING.md).
