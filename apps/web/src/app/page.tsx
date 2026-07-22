export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Catch silent API breaks before users do.</h1>
        <p>
          Semantic diffs for JSON responses and payloads — type changes, renamed
          fields, and nullability shifts — reported on every pull request.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="/pricing">
            Start free with the CLI
          </a>
          <a className="btn btn-secondary" href="/dashboard">
            Open dashboard
          </a>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h3>Semantic, not textual</h3>
          <p>
            Ignores key order and volatile timestamps. Flags `number` → `string`,
            removals, and object → null.
          </p>
        </article>
        <article className="panel">
          <h3>GitHub-native</h3>
          <p>
            Sticky PR comments from the Action or hosted GitHub App. Exit codes
            for CI gates.
          </p>
        </article>
        <article className="panel">
          <h3>Types on demand</h3>
          <p>
            Paid plans generate TypeScript + Zod from the latest candidate
            schema so clients stay in sync.
          </p>
        </article>
      </section>

      <section style={{ marginTop: "3rem" }}>
        <p className="muted mono">npx api-diff compare -b main.json -c pr.json -f markdown</p>
      </section>
    </>
  );
}
