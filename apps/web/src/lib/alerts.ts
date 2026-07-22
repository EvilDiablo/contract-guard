import type { DiffReport } from "@api-diff/core";

/** Post a simple Slack/Teams-compatible incoming webhook payload. */
export async function sendAlertWebhook(
  url: string,
  report: DiffReport,
  context: { repo: string; prNumber?: number; title?: string },
): Promise<void> {
  const text = [
    context.title ?? "API Diff Alert",
    `Repo: ${context.repo}`,
    context.prNumber ? `PR: #${context.prNumber}` : null,
    `Breaking: ${report.summary.breaking} | Warning: ${report.summary.warning} | Info: ${report.summary.info}`,
  ]
    .filter(Boolean)
    .join("\n");

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      summary: report.summary,
    }),
  });
}
