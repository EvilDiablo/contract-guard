# ContractGuard — catch breaking API changes before production

Semantic diffs for JSON API responses and payloads: type changes, removed keys, renames (`user_id` → `userId`), nullability shifts — reported in your terminal or as sticky GitHub PR comments.

## Install (recommended)

Requires **Node.js 22+**.

```bash
# One-off
npx @contractguard/cli compare -b baseline.json -c candidate.json -f markdown

# Or add as a dev dependency
npm install -D @contractguard/cli
npx contractguard compare -b baseline.json -c candidate.json -f markdown
```

Library use:

```bash
npm install @contractguard/core
```

Full install guide: [docs/install.md](docs/install.md).

## GitHub Action (other repos)

```yaml
name: ContractGuard
on: pull_request
jobs:
  contractguard:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: EvilDiablo/contract-guard/packages/github-action@v0.1.0
        with:
          baseline: path/to/baseline.json
          candidate: path/to/candidate.json
          title: "API contract changes"
          fail-on: breaking
```

Details: [docs/github-action.md](docs/github-action.md).

## Try the demo fixtures (this repo)

```bash
git clone https://github.com/EvilDiablo/contract-guard.git
cd contract-guard
pnpm install && pnpm build
pnpm contractguard compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  -f markdown
```

Expected breaking findings: `id` / `price` type changes, `user_id`→`userId` rename, `address`→`null`, `email` removed.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Clean, or `failOn: never` |
| `1` | Warnings only when `failOn: warning` |
| `2` | Breaking changes |

## Packages

| Package | Description |
| --- | --- |
| [`@contractguard/core`](packages/core) | Diff engine, reports, capture, codegen |
| [`@contractguard/cli`](packages/cli) | `contractguard` CLI |
| [`packages/github-action`](packages/github-action) | GitHub Action (use from GitHub, not npm) |
| [`apps/web`](apps/web) | Experimental hosted UI scaffold |

## Documentation

| Doc | Topic |
| --- | --- |
| [Install](docs/install.md) | npm + Action for your team |
| [Getting started](docs/getting-started.md) | First compare |
| [CLI](docs/cli.md) | Commands and flags |
| [GitHub Action](docs/github-action.md) | Inputs and sticky comments |
| [How it works](docs/how-it-works.md) | Semantic diff model |
| [Configuration](docs/configuration.md) | Config file |
| [Roadmap](docs/roadmap.md) | Public product plans |
| [Changelog](CHANGELOG.md) | Releases |
| [Contributing](CONTRIBUTING.md) | Developing this repo |

## License

MIT
