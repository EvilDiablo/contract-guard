# Roadmap

## MVP (complete — gated)

- Semantic JSON compare (SchemaIR)
- CLI: `compare`, `capture`, `generate`
- GitHub Action with sticky PR comments + committed bundle
- Config + default ignore paths
- Docs + `pnpm mvp:smoke`

See [MVP checklist](mvp-checklist.md).

## Deferred (Phase 3 — do not start until MVP gate stays green)

Ordered by distribution leverage:

1. **OpenAPI support** — compare OpenAPI YAML/JSON for a path/operation; CLI flags for baseline/candidate specs.
2. **npm publish** — dry-run then publish `@api-diff/core` + `@api-diff/cli` (`0.1.0`), `CHANGELOG.md`, workspace protocol rewrite.
3. **Action distribution** — release workflow that rebuilds and refreshes committed Action `dist/` on tag; Marketplace listing.
4. **Capture in CI** — example workflow hitting staging via `examples/api-diff.config.json`.
5. **Production SaaS** (`apps/web`) — auth, Drizzle migrations, real run history, Slack/Teams alerts, Stripe org onboarding. Treat current web app as scaffold only.

## Explicitly out of near-term scope

- gRPC / protobuf
- Full LLM output monitoring product (same engine can apply later)

## Contributing to roadmap items

Open an issue describing the use case, then follow [Contributing](../CONTRIBUTING.md). Prefer landing OpenAPI + publish before expanding SaaS surface area.
