# @contractguard/cli

CLI for [ContractGuard](https://github.com/EvilDiablo/contract-guard) — semantic diffs for JSON API responses and payloads.

Catch silent breaking changes (type changes, removed fields, renames, nullability) before they hit production.

## Install

```bash
# one-off
npx @contractguard/cli compare -b baseline.json -c candidate.json -f markdown

# project dependency
npm install -D @contractguard/cli
npx contractguard compare -b baseline.json -c candidate.json -f markdown
```

Requires **Node.js 22+**.

## Commands

### `compare`

```bash
npx contractguard compare \
  -b baseline.json \
  -c candidate.json \
  -f markdown \
  --failOn breaking
```

| Flag | Description |
| --- | --- |
| `-b, --baseline` | Baseline JSON file |
| `-c, --candidate` | Candidate JSON file |
| `-f, --format` | `text` \| `markdown` \| `json` |
| `--failOn` | `breaking` (default) \| `warning` \| `never` |
| `-C, --config` | Path to `contractguard.config.json` |
| `--codegen` | Write TypeScript + Zod from candidate |

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Clean, or `failOn: never` |
| `1` | Warnings only when `failOn: warning` |
| `2` | Breaking changes |

### `capture`

Hit staging endpoints from config and save JSON snapshots.

```bash
export CONTRACTGUARD_TOKEN=...
npx contractguard capture -C contractguard.config.json -o captures/
```

### `generate`

```bash
npx contractguard generate -i snapshot.json -o types/ --name ApiResponse
npx contractguard generate -i captures/ -o types/
```

## GitHub Action

```yaml
- uses: EvilDiablo/contract-guard/packages/github-action@v0.1.1
  with:
    baseline: path/to/baseline.json   # or directory of *.json samples
    candidate: path/to/candidate.json
```

## Docs

- [Install guide](https://github.com/EvilDiablo/contract-guard/blob/main/docs/install.md)
- [Lifecycle](https://github.com/EvilDiablo/contract-guard/blob/main/docs/lifecycle.md)
- [CLI reference](https://github.com/EvilDiablo/contract-guard/blob/main/docs/cli.md)
- [Configuration](https://github.com/EvilDiablo/contract-guard/blob/main/docs/configuration.md)
- [Repository](https://github.com/EvilDiablo/contract-guard)

## License

MIT
