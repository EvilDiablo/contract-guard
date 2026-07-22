# MVP acceptance checklist

The JSON-snapshot MVP is **core + CLI + GitHub Action**. Hosted SaaS (`apps/web`) is experimental and not required for this gate.

Run from the repository root after install.

## Commands

```bash
# 1–2. Install and build
pnpm install
pnpm build

# 3. Unit tests
pnpm --filter @contractguard/core test
# Expect: 13+ tests passed

# 4. Breaking compare → exit 2
pnpm contractguard compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  -f markdown
# Expect: Markdown with BREAKING + <!-- contractguard-report -->, exit 2

# 5. failOn never → exit 0
pnpm contractguard compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  --failOn never
# Expect: exit 0

# 6. Codegen
pnpm contractguard generate \
  -i examples/fixtures/candidate-users.json \
  -o .tmp/types \
  --name UserResponse
# Expect: .tmp/types/api.ts and api.zod.ts

# 7. Action bundle present
# Expect file: packages/github-action/dist/main.js

# 8. Automated smoke (covers 4–7)
pnpm mvp:smoke
```

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm build`
3. `pnpm test`
4. `pnpm mvp:smoke`

## Status

Last local verification (this workspace): **green** — core tests, CLI smoke tests, `mvp:smoke`, fixture compare exit codes, codegen, Action `dist/main.js`, and workspace bin link all passed.

**Gate:** Do not start deferred roadmap work (OpenAPI, npm publish, production SaaS) until this checklist stays green.
