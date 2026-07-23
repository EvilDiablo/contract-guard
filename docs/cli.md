# CLI reference

Binary: `contractguard` (package `@contractguard/cli`).

## Install

```bash
npm install -D @contractguard/cli
npx contractguard <command> ...
```

Or without installing:

```bash
npx @contractguard/cli <command> ...
```

When developing **this** monorepo after `pnpm build`:

```bash
pnpm contractguard <command> ...
# or
node packages/cli/dist/index.js <command> ...
```

## Commands

### `compare`

Semantically compare two JSON snapshots. Each of `-b` / `-c` may be a **single JSON file** or a **directory of `*.json` files** (sorted, merged into one schema before diffing). Capture dirs are safe: `manifest.json` is skipped (and when present, only the snapshot files it lists are loaded).

```bash
pnpm contractguard compare \
  -b path/to/baseline.json \
  -c path/to/candidate.json \
  -f markdown \
  -o report.md \
  --failOn breaking \
  --ignore "*.trace_id" \
  --side response \
  --title "ContractGuard Report" \
  --codegen types/
```

Multi-sample directories:

```bash
pnpm contractguard compare \
  -b examples/fixtures/multi/baseline \
  -c examples/fixtures/multi/candidate \
  -f markdown
```

Fields present in only some baseline samples are treated as optional. See [Lifecycle](lifecycle.md).

| Flag | Description |
| --- | --- |
| `-b, --baseline` | Baseline JSON file or directory of `*.json` samples (required) |
| `-c, --candidate` | Candidate JSON file or directory of `*.json` samples (required) |
| `-C, --config` | Path to `contractguard.config.json` |
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
export CONTRACTGUARD_TOKEN=...   # optional Bearer token
pnpm contractguard capture -C examples/contractguard.config.json -o captures/
```

| Flag | Description |
| --- | --- |
| `-C, --config` | Config with `endpoints` / `baseUrl` |
| `-o, --out` | Output directory (default `captures`) |
| `--baseUrl` | Override config `baseUrl` |
| `--header` | Extra `Name:Value` headers (comma-separated) |

Env: `CONTRACTGUARD_TOKEN` (preferred) or legacy `API_DIFF_TOKEN` → `Authorization: Bearer …` when not already set. Header values may use `${ENV_VAR}` expansion.

### `generate`

Emit TypeScript + Zod from a JSON file **or a directory** of snapshots (e.g. a `capture` output folder).

```bash
# Single file (optional --name; default derives from filename)
pnpm contractguard generate -i snapshot.json -o types/ --name ApiResponse

# Directory: one type per snapshot, names from capture manifest or filenames
pnpm contractguard generate -i contracts/candidate -o types/
```

Writes `types/api.ts` and `types/api.zod.ts` with **all** exports in one barrel (no overwrite of earlier endpoints). `manifest.json` is skipped. `--name` only applies when `-i` is a single file.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | No failing findings for the chosen `failOn`, or `failOn: never` |
| `1` | Warnings present when `failOn: warning` |
| `2` | Breaking findings when `failOn` is `breaking` or `warning` |

## Config discovery

If `--config` is omitted, the CLI looks for (in order):

1. `contractguard.config.json`
2. `.contractguardrc`
3. `.contractguardrc.json`

See [Configuration](configuration.md).
