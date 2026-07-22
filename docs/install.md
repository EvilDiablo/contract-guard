# Install ContractGuard

Use these steps in **your** project. You do not need to clone this repository.

## CLI (npm)

Requires Node.js **22+**.

### Quick try

```bash
npx @contractguard/cli compare \
  -b path/to/baseline.json \
  -c path/to/candidate.json \
  -f markdown
```

### Project dependency

```bash
npm install -D @contractguard/cli
# or: pnpm add -D @contractguard/cli
# or: yarn add -D @contractguard/cli
```

```bash
npx contractguard compare -b baseline.json -c candidate.json -f markdown
npx contractguard compare -b baseline.json -c candidate.json --failOn never
npx contractguard generate -i candidate.json -o types/ --name ApiResponse
```

Optional config file in your repo root: `contractguard.config.json` (see [configuration.md](configuration.md)).

### Library

```bash
npm install @contractguard/core
```

```ts
import { compareJson, formatMarkdownReport } from "@contractguard/core";

const report = compareJson(baseline, candidate);
console.log(formatMarkdownReport(report));
```

## GitHub Action

Pin a release tag so other repositories can use the Action without building this monorepo.

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
      - uses: EvilDiablo/contract-guard/packages/github-action@v0.1.0
        with:
          baseline: contracts/baseline.json
          candidate: contracts/candidate.json
          config: contractguard.config.json
          title: "ContractGuard Report"
          fail-on: breaking
          comment: "true"
```

- The Action posts or updates a sticky PR comment marked with `<!-- contractguard-report -->`.
- Set `fail-on: never` to report findings without failing the job.
- The GitHub repository must be **public** (or callers need access) for `uses:` to work across orgs.

More inputs: [github-action.md](github-action.md).

## Maintainer: publish to npm

Scoped packages require an npm user/org that owns `@contractguard`.

```bash
npm login
npm whoami
# Create org if needed: https://www.npmjs.com/org/create  (name: contractguard)

pnpm install
pnpm mvp:smoke
pnpm publish:dry          # verify packing
pnpm publish:packages     # publishes @contractguard/core then @contractguard/cli
```

Then tag the Action release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Verify:

```bash
npm view @contractguard/cli version
```

## Developing this repository

```bash
pnpm install
pnpm build
pnpm mvp:smoke
```

See [Contributing](../CONTRIBUTING.md).
