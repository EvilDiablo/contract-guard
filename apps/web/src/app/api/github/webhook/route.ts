import { NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import {
  compareJson,
  formatMarkdownReport,
  type JsonValue,
} from "@contractguard/core";
import { upsertPrComment } from "@/lib/github";
import { getDb, schema } from "@/db/client";

export const runtime = "nodejs";

/**
 * GitHub App webhook.
 * Expects PR payloads that include optional `api_diff` check-run style inputs,
 * or looks for baseline/candidate JSON URLs in PR body markers:
 *   <!-- contractguard:baseline=url -->
 *   <!-- contractguard:candidate=url -->
 */
export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "GITHUB_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }

  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const webhooks = new Webhooks({ secret });

  try {
    await webhooks.verify(payload, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const body = JSON.parse(payload) as {
    action?: string;
    installation?: { id: number };
    repository?: { full_name: string; name: string; owner: { login: string } };
    pull_request?: {
      number: number;
      body: string | null;
      head: { sha: string };
    };
  };

  if (event === "installation" && body.action === "created" && body.installation) {
    try {
      const db = getDb();
      await db.insert(schema.githubInstallations).values({
        installationId: body.installation.id,
        accountLogin: body.repository?.owner.login ?? "unknown",
        accountType: "Organization",
      });
    } catch {
      // DB optional in local/dev without DATABASE_URL
    }
    return NextResponse.json({ ok: true, handled: "installation" });
  }

  if (
    event === "pull_request" &&
    body.pull_request &&
    body.repository &&
    body.installation &&
    (body.action === "opened" || body.action === "synchronize" || body.action === "reopened")
  ) {
    const prBody = body.pull_request.body ?? "";
    const baselineUrl = prBody.match(/<!--\s*contractguard:baseline=(.+?)\s*-->/)?.[1];
    const candidateUrl = prBody.match(/<!--\s*contractguard:candidate=(.+?)\s*-->/)?.[1];

    if (!baselineUrl || !candidateUrl) {
      return NextResponse.json({
        ok: true,
        skipped: "No contractguard baseline/candidate markers in PR body",
      });
    }

    const [baselineRes, candidateRes] = await Promise.all([
      fetch(baselineUrl),
      fetch(candidateUrl),
    ]);
    const baseline = (await baselineRes.json()) as JsonValue;
    const candidate = (await candidateRes.json()) as JsonValue;

    const report = compareJson(baseline, candidate, {
      baselineLabel: baselineUrl,
      candidateLabel: candidateUrl,
    });
    const markdown = formatMarkdownReport(
      report,
      `ContractGuard Report — ${body.repository.full_name}#${body.pull_request.number}`,
    );

    await upsertPrComment({
      installationId: body.installation.id,
      owner: body.repository.owner.login,
      repo: body.repository.name,
      issueNumber: body.pull_request.number,
      body: markdown,
    });

    try {
      const db = getDb();
      await db.insert(schema.diffRuns).values({
        installationId: body.installation.id,
        repoFullName: body.repository.full_name,
        prNumber: body.pull_request.number,
        baselineLabel: baselineUrl,
        candidateLabel: candidateUrl,
        breakingCount: report.summary.breaking,
        warningCount: report.summary.warning,
        infoCount: report.summary.info,
        report,
      });
    } catch {
      // ignore persistence errors when DB is not configured
    }

    return NextResponse.json({
      ok: true,
      summary: report.summary,
    });
  }

  return NextResponse.json({ ok: true, ignored: event });
}
