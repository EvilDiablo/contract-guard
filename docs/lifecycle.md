# Snapshot lifecycle

ContractGuard is framework-agnostic: you save JSON snapshots any way you like (test harness, `curl`, `contractguard capture`, staging replay). The workflow is the same.

## 1. Capture or save JSON

Produce one or more response (or request) bodies that represent the contract you care about.

- **Single sample** — one representative JSON file
- **Multiple samples** — a directory of `*.json` files (merged before diffing). If the directory came from `contractguard capture`, `manifest.json` is ignored as a sample.

Fields that appear in only some baseline samples become **optional**. Dropping an optional field on the candidate is not breaking.

## 2. Commit a baseline

Store the baseline under version control (for example `contracts/baseline.json` or `contracts/baseline/*.json`). This is the “known good” shape for CI.

## 3. Produce a candidate on the PR

On each change, generate a candidate the same way:

- Fixture updated by the PR
- Output of your integration tests
- `contractguard capture` against a staging URL

Keep baseline and candidate acquisition parallel so diffs reflect API shape, not tooling noise.

## 4. Run ContractGuard in CI

Use the CLI or GitHub Action with the same paths:

```bash
npx @contractguard/cli compare \
  -b contracts/baseline \
  -c contracts/candidate \
  -f markdown \
  --failOn breaking
```

Or pin the Action (see [Install](install.md)):

```yaml
- uses: EvilDiablo/contract-guard/packages/github-action@v0.1.1
  with:
    baseline: contracts/baseline
    candidate: contracts/candidate
```

Both `-b` / `-c` and Action inputs accept a **file** or a **directory** of `*.json` samples.

## 5. Promote candidate → baseline when intentional

When a breaking (or optional) change is deliberate:

1. Update clients / docs as needed
2. Replace the committed baseline with the candidate snapshots
3. Merge

Unintentional breaks stay as failed CI until fixed or explicitly promoted.

## Related

- [Getting started](getting-started.md)
- [CLI](cli.md)
- [GitHub Action](github-action.md)
- [How it works](how-it-works.md)
