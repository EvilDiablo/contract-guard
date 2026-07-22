# Contributing

Thanks for helping improve ContractGuard.

## Repository layout

```text
packages/core           # SchemaIR, diff, report, capture, codegen
packages/cli            # contractguard CLI
packages/github-action  # GitHub Action (commit dist/ after Action/core changes)
apps/web                # Experimental hosted UI scaffold
examples/               # Fixtures, sample config, sample workflow
docs/                   # Public user documentation
scripts/mvp-smoke.mjs   # MVP acceptance smoke suite
local/                  # Gitignored — private notes only (never commit)
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

- Prefer changing behavior in `@contractguard/core` and covering it with Vitest goldens under `packages/core/src/*.test.ts`.
- CLI smoke tests live in `packages/cli/src/cli.smoke.test.ts` (require a prior `pnpm build`).
- After editing the Action or core code used by the Action:

  ```bash
  pnpm --filter @contractguard/core build
  pnpm --filter @contractguard/github-action build
  ```

  Commit `packages/github-action/dist/` — it is not ignored (see `.gitignore` exceptions).

- Keep `apps/web` changes isolated unless you are intentionally working on the experimental UI.
- Do **not** commit business/pricing notes. Use gitignored `local/` (or notes outside the clone).

## Publishing (maintainers)

See [docs/install.md](docs/install.md#maintainer-publish-to-npm) and [CHANGELOG.md](CHANGELOG.md).

```bash
pnpm publish:dry
pnpm publish:packages   # requires npm login + @contractguard scope
```

## Pull requests

1. Keep the [MVP checklist](docs/mvp-checklist.md) green.
2. Update docs when you change CLI flags, Action inputs, or severity rules.
3. Keep the [public roadmap](docs/roadmap.md) free of monetization/pricing language.

## License

By contributing you agree that your contributions are licensed under the MIT License.
