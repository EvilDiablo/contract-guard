# GitHub Action

Path: [`packages/github-action`](../packages/github-action)

The Action runs a semantic compare, writes `contractguard-report.md`, adds a job summary, and (on pull requests) creates or updates a **sticky** comment identified by `<!-- contractguard-report -->`.

The bundled runtime (`dist/main.js`) is **committed** so workflows can use the Action without a build step.

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

## Minimal workflow

```yaml
name: ContractGuard
on: pull_request
jobs:
  contractguard:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: ./packages/github-action
        with:
          baseline: examples/fixtures/baseline-users.json
          candidate: examples/fixtures/candidate-users.json
          title: "Breaking API Changes Detected in /v1/users"
          fail-on: breaking
```

Full example: [`examples/workflows/api-diff.yml`](../examples/workflows/api-diff.yml).

## Sticky comments

The Markdown reporter always includes:

```html
<!-- contractguard-report -->
```

On subsequent PR pushes the Action updates the existing comment instead of creating duplicates.

## Rebuilding the Action bundle

After changing Action or core source:

```bash
pnpm --filter @contractguard/core build
pnpm --filter @contractguard/github-action build
```

Commit the updated `packages/github-action/dist/` artifacts when shipping Action changes.
