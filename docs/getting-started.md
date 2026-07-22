# Getting started

## Prerequisites

- Node.js **22+**
- pnpm **9+** (repo pins `packageManager: pnpm@9.15.0`)

If pnpm is not installed globally:

```bash
npx pnpm@9.15.0 install
npx pnpm@9.15.0 build
```

## Install and build

From the repository root:

```bash
pnpm install
pnpm build
```

This builds:

- `@api-diff/core` → `packages/core/dist`
- `@api-diff/cli` → `packages/cli/dist` (bin: `api-diff`)
- `@api-diff/github-action` → `packages/github-action/dist/main.js` (committed for Action use)
- `@api-diff/web` → Next.js production build (experimental)

## First compare

```bash
pnpm api-diff compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  -f markdown
```

You should see a Markdown report with sticky marker `<!-- api-diff-report -->` and exit code **2**.

To keep CI green while still printing findings:

```bash
pnpm api-diff compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  --failOn never
```

## Generate types from a snapshot

```bash
pnpm api-diff generate \
  -i examples/fixtures/candidate-users.json \
  -o .tmp/types \
  --name UserResponse
```

Writes `.tmp/types/api.ts` and `.tmp/types/api.zod.ts`.

## Verify the MVP

```bash
pnpm --filter @api-diff/core test
pnpm mvp:smoke
```

See [MVP checklist](mvp-checklist.md) for the full acceptance list.

## Next reading

- [CLI reference](cli.md)
- [How it works](how-it-works.md)
- [GitHub Action](github-action.md)
