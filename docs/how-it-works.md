# How it works

ContractGuard compares **structure**, not raw text. Key order and formatting never matter. Dynamic values (timestamps) are ignored by default.

```text
JSON baseline ──┐
                ├──► normalizeValue() ──► SchemaIR trees
JSON candidate ─┘              │
                               ▼
                         diffSchemas()
                               │
                               ▼
                    DiffReport (findings)
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
            text          markdown           json
```

## 1. Normalize → SchemaIR

[`packages/core/src/normalize.ts`](../packages/core/src/normalize.ts) walks a concrete JSON value and produces a schema tree:

- primitives → `string` / `number` / `boolean` / `null`
- objects → properties + required keys
- arrays → union of element schemas
- nullability tracked on nodes

Concrete values like `19.99` vs `"19.99"` become different kinds (`number` vs `string`).

## 2. Semantic diff

[`packages/core/src/diff.ts`](../packages/core/src/diff.ts) walks both trees and emits findings:

| Change | Typical severity (response side) |
| --- | --- |
| Type change | **breaking** |
| Field removed | **breaking** |
| Object → `null` | **breaking** |
| Possible rename (`user_id` → `userId`) | **breaking** (+ suggestion) |
| Field added | **info** (configurable → warning) |
| Became nullable | **breaking** |
| Required tightened (request side) | **breaking** |

Ignore globs skip paths before comparison (see [Configuration](configuration.md)).

Rename detection uses token + Levenshtein similarity on sibling keys ([`packages/core/src/rename.ts`](../packages/core/src/rename.ts)).

## 3. Report and exit codes

[`packages/core/src/report.ts`](../packages/core/src/report.ts) formats findings for terminals, PR comments, and machines.

High-level API used by CLI / Action / web:

```ts
import { compareJson, formatMarkdownReport, exitCodeForReport } from "@contractguard/core";

const report = compareJson(baseline, candidate);
const md = formatMarkdownReport(report);
const code = exitCodeForReport(report, "breaking"); // 0 | 1 | 2
```

## Surfaces

| Surface | Role |
| --- | --- |
| CLI | Acquire files / capture HTTP; print or write reports |
| GitHub Action | Same compare; sticky PR comment |
| `apps/web` | Experimental hosted API + dashboard (not MVP) |

All surfaces share `@contractguard/core` — one meaning of “breaking.”
