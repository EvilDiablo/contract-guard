# GitHub Action

Path: [`packages/github-action`](../packages/github-action)

The Action runs a semantic compare, writes `contractguard-report.md`, adds a job summary, and (on pull requests) creates or updates a **sticky** comment identified by `<!-- contractguard-report -->`.

The bundled runtime (`dist/main.js`) is **committed** so workflows can use the Action without a build step.

## Use from another repository

```yaml
- uses: EvilDiablo/contract-guard/packages/github-action@v0.1.0
  with:
    baseline: contracts/baseline.json
    candidate: contracts/candidate.json
    fail-on: breaking
```

See [Install](install.md) for a full workflow. The `contract-guard` GitHub repo must be public (or your token must have access).

## Runtime

```yaml
runs:
  using: node24
  main: dist/main.js
```

GitHub Actions JavaScript runtimes support `node20` and `node24` only (not `node22`). This Action uses **node24**.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `baseline` | yes | — | Path to baseline JSON |
| `candidate` | yes | — | Path to candidate JSON |
| `config` | no | — | Path to `contractguard.config.json` |
| `title` | no | `ContractGuard Report` | PR comment / report title |
| `fail-on` | no | `breaking` | `breaking` \| `warning` \| `never` |
| `comment` | no | `true` | Post sticky PR comment |
| `github-token` | no | `${{ github.token }}` | Token for comments |

## Outputs

| Output | Description |
| --- | --- |
| `breaking` | Breaking finding count |
| `warning` | Warning finding count |
| `report-path` | Path to written Markdown report |

## Dogfood in this repository

```yaml
- uses: ./packages/github-action
  with:
    baseline: examples/fixtures/baseline-users.json
    candidate: examples/fixtures/candidate-users.json
    fail-on: never
```

Full example: [`examples/workflows/contractguard.yml`](../examples/workflows/contractguard.yml).

## Sticky comments

The Markdown reporter always includes:

```html
<!-- contractguard-report -->
```

On subsequent PR pushes the Action updates the existing comment instead of creating duplicates.

## Rebuilding the Action bundle (maintainers)

```bash
pnpm --filter @contractguard/core build
pnpm --filter @contractguard/github-action build
```

Commit the updated `packages/github-action/dist/` artifacts when shipping Action changes.
