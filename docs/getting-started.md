# Getting started

## Use ContractGuard in your project (no clone)

See **[Install](install.md)** for npm and GitHub Action setup.

```bash
npx @contractguard/cli compare -b baseline.json -c candidate.json -f markdown
```

## Try the demo in this repository

```bash
pnpm install
pnpm build
pnpm contractguard compare \
  -b examples/fixtures/baseline-users.json \
  -c examples/fixtures/candidate-users.json \
  -f markdown
```

You should see a Markdown report with sticky marker `<!-- contractguard-report -->` and exit code **2**.

To print findings without failing:

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

## Verify the MVP (contributors)

```bash
pnpm --filter @contractguard/core test
pnpm mvp:smoke
```

See [MVP checklist](mvp-checklist.md).

## Next reading

- [Install](install.md)
- [CLI reference](cli.md)
- [How it works](how-it-works.md)
- [GitHub Action](github-action.md)
