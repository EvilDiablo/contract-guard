# CLI reference

Binary: `api-diff` (package `@api-diff/cli`).

After `pnpm install` + `pnpm build` at the repo root:

```bash
pnpm api-diff <command> ...
# or
node packages/cli/dist/index.js <command> ...
# or (when the workspace bin is linked)
npx api-diff <command> ...
```

## Commands

### `compare`

Semantically compare two JSON snapshot files.

```bash
pnpm api-diff compare \
  -b path/to/baseline.json \
  -c path/to/candidate.json \
  -f markdown \
  -o report.md \
  --failOn breaking \
  --ignore "*.trace_id" \
  --side response \
  --title "API Diff Report" \
  --codegen types/
```

| Flag | Description |
| --- | --- |
| `-b, --baseline` | Baseline JSON path (required) |
| `-c, --candidate` | Candidate JSON path (required) |
| `-C, --config` | Path to `api-diff.config.json` |
| `-f, --format` | `text` (default), `markdown` / `md`, or `json` |
| `-o, --out` | Write report to a file |
| `--failOn` | `breaking` (default), `warning`, or `never` |
| `--ignore` | Comma-separated ignore globs (merged with config) |
| `--side` | `response` (default) or `request` |
| `--title` | Markdown report title |
| `--codegen` | Directory to write TS + Zod from the candidate |

### `capture`

Hit endpoints listed in config and save JSON snapshots.

```bash
export API_DIFF_TOKEN=...   # optional Bearer token
pnpm api-diff capture -C examples/api-diff.config.json -o captures/
```

| Flag | Description |
| --- | --- |
| `-C, --config` | Config with `endpoints` / `baseUrl` |
| `-o, --out` | Output directory (default `captures`) |
| `--baseUrl` | Override config `baseUrl` |
| `--header` | Extra `Name:Value` headers (comma-separated) |

Env: `API_DIFF_TOKEN` → `Authorization: Bearer …` when not already set. Header values may use `${ENV_VAR}` expansion.

### `generate`

Emit TypeScript + Zod from a JSON snapshot.

```bash
pnpm api-diff generate -i snapshot.json -o types/ --name ApiResponse
```

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | No failing findings for the chosen `failOn`, or `failOn: never` |
| `1` | Warnings present when `failOn: warning` |
| `2` | Breaking findings when `failOn` is `breaking` or `warning` |

## Config discovery

If `--config` is omitted, the CLI looks for (in order):

1. `api-diff.config.json`
2. `.apidiffrc`
3. `.apidiffrc.json`

See [Configuration](configuration.md).
