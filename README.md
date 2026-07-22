# api-diff — API Response & Payload Diff Engine

Catch silent breaking changes in JSON API responses and payloads **before** they hit production.

Semantic comparison (not text diff): type changes, removed keys, renames (`user_id` → `userId`), nullability shifts — with sticky GitHub PR comments.

## 60-second quick start

Requires **Node.js 22+** and [pnpm](https://pnpm.io) 9+ (or use `npx pnpm@9.15.0`).

```bash
pnpm install
pnpm build
pnpm --filter @api-diff/core test

# Compare classic breaking fixtures (exit code 2 = breaking)
pnpm api-diff compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  -f markdown

# Same compare, do not fail the process
pnpm api-diff compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  --failOn never

# Full MVP smoke suite
pnpm mvp:smoke
```

Equivalent without the `pnpm api-diff` script:

```bash
node packages/cli/dist/index.js compare -b examples/fixtures/baseline-users.json -c examples/fixtures/candidate-users.json -f markdown
```

### Expected demo findings

Comparing the example fixtures should report breaking changes for:

- `id`: `number` → `string`
- `price`: `number` → `string`
- `user_id` → possible rename to `userId`
- `address`: object → `null`
- `email`: field removed

…and an informational finding for the additive `new_field`.

## Packages

| Package | Description | MVP |
| --- | --- | --- |
| [`@api-diff/core`](packages/core) | SchemaIR normalize, semantic diff, reports, capture, codegen | Yes |
| [`@api-diff/cli`](packages/cli) | `api-diff compare \| capture \| generate` | Yes |
| [`@api-diff/github-action`](packages/github-action) | CI Action + sticky PR comments (bundled `dist/` committed) | Yes |
| [`@api-diff/web`](apps/web) | Hosted dashboard / GitHub App / Stripe scaffold | Experimental |

## Documentation

| Doc | Topic |
| --- | --- |
| [Getting started](docs/getting-started.md) | Install, build, first compare |
| [CLI reference](docs/cli.md) | Commands, exit codes, outputs |
| [GitHub Action](docs/github-action.md) | Inputs, sticky comments, example workflow |
| [How it works](docs/how-it-works.md) | Normalize → SchemaIR → semantic diff |
| [Configuration](docs/configuration.md) | `api-diff.config.json` and ignore paths |
| [MVP checklist](docs/mvp-checklist.md) | Acceptance commands |
| [Roadmap](docs/roadmap.md) | Deferred next steps (OpenAPI, publish, SaaS) |
| [Contributing](CONTRIBUTING.md) | Monorepo layout, build, test |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Clean, or `failOn: never` |
| `1` | Warnings only when `failOn: warning` |
| `2` | Breaking changes |

## License

MIT
