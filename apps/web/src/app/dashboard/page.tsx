import { compareJson, formatMarkdownReport } from "@contractguard/core";

const demoBaseline = {
  id: 101,
  user_id: 42,
  email: "ada@example.com",
  price: 19.99,
  address: { city: "London" },
};

const demoCandidate = {
  id: "101",
  userId: 42,
  price: "19.99",
  address: null,
  new_field: "test",
};

export default function DashboardPage() {
  const report = compareJson(demoBaseline, demoCandidate, {
    baselineLabel: "main",
    candidateLabel: "feature",
  });
  const markdown = formatMarkdownReport(report, "Latest demo run");

  return (
    <section>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem" }}>
        Dashboard
      </h1>
      <p className="muted">
        Demo run using the classic breaking-change fixtures. Connect Postgres +
        GitHub App env vars for live org history.
      </p>

      <div className="dashboard-stats">
        <div className="panel stat">
          <strong style={{ color: "var(--danger)" }}>{report.summary.breaking}</strong>
          <span>Breaking</span>
        </div>
        <div className="panel stat">
          <strong style={{ color: "var(--warn)" }}>{report.summary.warning}</strong>
          <span>Warning</span>
        </div>
        <div className="panel stat">
          <strong>{report.summary.info}</strong>
          <span>Info</span>
        </div>
      </div>

      <article className="panel">
        <h3>Report preview</h3>
        <pre
          className="mono"
          style={{
            whiteSpace: "pre-wrap",
            color: "var(--muted)",
            margin: "0.75rem 0 0",
          }}
        >
          {markdown}
        </pre>
      </article>
    </section>
  );
}
