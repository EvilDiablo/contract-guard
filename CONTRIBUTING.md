# Contributing

Thanks for helping improve api-diff.

## Repository layout

```text
packages/core           # SchemaIR, diff, report, capture, codegen
packages/cli            # api-diff CLI
packages/github-action  # GitHub Action (commit dist/ after Action/core changes)
apps/web                # Experimental SaaS scaffold (not MVP)
examples/               # Fixtures, sample config, sample workflow
docs/                   # User documentation
scripts/mvp-smoke.mjs   # MVP acceptance smoke suite
```

## Tooling

- Node.js **22+**
- pnpm **9** (see root `packageManager`)
- Turborepo for `build` / `test` / `lint` / `typecheck`

```bash
pnpm install
pnpm build
pnpm test
pnpm mvp:smoke
```

## Development tips

- Prefer changing behavior in `@api-diff/core` and covering it with Vitest goldens under `packages/core/src/*.test.ts`.
- CLI smoke tests live in `packages/cli/src/cli.smoke.test.ts` (require a prior `pnpm build`).
- After editing the Action or core code used by the Action:

  ```bash
  pnpm --filter @api-diff/core build
  pnpm --filter @api-diff/github-action build
  ```

  Commit `packages/github-action/dist/` — it is not ignored (see `.gitignore` exceptions).

- Keep `apps/web` changes isolated unless you are intentionally working on the deferred SaaS roadmap.

## Pull requests

1. Keep the [MVP checklist](docs/mvp-checklist.md) green.
2. Update docs when you change CLI flags, Action inputs, or severity rules.
3. Do not start OpenAPI / npm publish / production SaaS work in the same PR as unrelated MVP fixes — see [roadmap](docs/roadmap.md).

## License

By contributing you agree that your contributions are licensed under the MIT License.
