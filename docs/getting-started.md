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

- `@contractguard/core` → `packages/core/dist`
- `@contractguard/cli` → `packages/cli/dist` (bin: `contractguard`)
- `@contractguard/github-action` → `packages/github-action/dist/main.js` (committed for Action use)
- `@contractguard/web` → Next.js production build (experimental)

## First compare

```bash
pnpm contractguard compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  -f markdown
```

You should see a Markdown report with sticky marker `<!-- contractguard-report -->` and exit code **2**.

To keep CI green while still printing findings:

```bash
pnpm contractguard compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  --failOn never
```

## Generate types from a snapshot

```bash
pnpm contractguard generate \
  -i examples/fixtures/candidate-users.json \
  -o .tmp/types \
  --name UserResponse
```

Writes `.tmp/types/api.ts` and `.tmp/types/api.zod.ts`.

## Verify the MVP

```bash
pnpm --filter @contractguard/core test
pnpm mvp:smoke
```

See [MVP checklist](mvp-checklist.md) for the full acceptance list.

## Next reading

- [CLI reference](cli.md)
- [How it works](how-it-works.md)
- [GitHub Action](github-action.md)
