# @contractguard/core

Semantic API contract diff engine for JSON responses and payloads.

Compares **structure** (types, keys, nullability, renames) — not text. Used by [`@contractguard/cli`](https://www.npmjs.com/package/@contractguard/cli) and the [GitHub Action](https://github.com/EvilDiablo/contract-guard).

## Install

```bash
npm install @contractguard/core
```

## Quick use

```ts
import {
  compareJson,
  formatMarkdownReport,
  exitCodeForReport,
} from "@contractguard/core";

const report = compareJson(
  { id: 1, price: 19.99 },
  { id: "1", price: "19.99" },
);

console.log(formatMarkdownReport(report));
process.exitCode = exitCodeForReport(report); // 0 | 1 | 2
```

## Features

- Normalize JSON → SchemaIR
- Semantic diff (type changes, removals, renames, nullability)
- Configurable ignore paths (e.g. timestamps)
- Markdown / text / JSON reports
- Optional TypeScript + Zod codegen helpers
- HTTP `capture` helpers for staging snapshots

## Docs

- [Install & CLI](https://github.com/EvilDiablo/contract-guard/blob/main/docs/install.md)
- [How it works](https://github.com/EvilDiablo/contract-guard/blob/main/docs/how-it-works.md)
- [Configuration](https://github.com/EvilDiablo/contract-guard/blob/main/docs/configuration.md)
- [Repository](https://github.com/EvilDiablo/contract-guard)

## License

MIT
