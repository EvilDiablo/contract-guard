import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  compareJsonSamples,
  exitCodeForReport,
  formatMarkdownReport,
  loadConfigFromJson,
  loadJsonSamples,
  type FailOn,
} from "@contractguard/core";

const MARKER = "<!-- contractguard-report -->";

async function upsertStickyComment(
  token: string,
  body: string,
): Promise<void> {
  const ctx = github.context;
  if (!ctx.payload.pull_request) {
    core.info("Not a pull_request event — skipping comment");
    return;
  }

  const octokit = github.getOctokit(token);
  const { owner, repo } = ctx.repo;
  const issue_number = ctx.payload.pull_request.number;

  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number,
    per_page: 100,
  });

  const existing = comments.find((c) => c.body?.includes(MARKER));
  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    core.info(`Updated sticky comment #${existing.id}`);
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
    core.info("Created sticky PR comment");
  }
}

async function run(): Promise<void> {
  try {
    const baselinePath = core.getInput("baseline", { required: true });
    const candidatePath = core.getInput("candidate", { required: true });
    const configPath = core.getInput("config");
    const title = core.getInput("title") || "ContractGuard Report";
    const normalizedTitle =
      title === "API Diff Report" ? "ContractGuard Report" : title;
    const failOn = (core.getInput("fail-on") || "breaking") as FailOn;
    const shouldComment = (core.getInput("comment") || "true") === "true";
    const token = core.getInput("github-token") || process.env.GITHUB_TOKEN || "";

    let ignorePaths: string[] = [];
    let additiveSeverity: "info" | "warning" = "info";
    let side: "response" | "request" = "response";
    let configFailOn: FailOn | undefined;

    if (configPath) {
      const config = loadConfigFromJson(await readFile(resolve(configPath), "utf8"));
      ignorePaths = config.ignorePaths ?? [];
      additiveSeverity = config.additiveSeverity ?? "info";
      side = config.side ?? "response";
      configFailOn = config.failOn;
    }

    const baselineLoaded = await loadJsonSamples(baselinePath);
    const candidateLoaded = await loadJsonSamples(candidatePath);

    const report = compareJsonSamples(baselineLoaded.samples, candidateLoaded.samples, {
      ignorePaths,
      additiveSeverity,
      side,
      baselineLabel: baselineLoaded.label,
      candidateLabel: candidateLoaded.label,
    });

    const markdown = formatMarkdownReport(report, normalizedTitle);
    const reportPath = resolve("contractguard-report.md");
    await mkdir(resolve("."), { recursive: true });
    await writeFile(reportPath, markdown, "utf8");

    core.setOutput("breaking", String(report.summary.breaking));
    core.setOutput("warning", String(report.summary.warning));
    core.setOutput("report-path", reportPath);
    core.setOutput("baseline-samples", String(report.summary.baselineSamples ?? 1));
    core.setOutput("candidate-samples", String(report.summary.candidateSamples ?? 1));

    await core.summary
      .addRaw(markdown)
      .write();

    if (shouldComment && token) {
      await upsertStickyComment(token, markdown);
    } else if (shouldComment && !token) {
      core.warning("No github-token available; skipped PR comment");
    }

    const code = exitCodeForReport(report, configFailOn ?? failOn);
    if (code !== 0) {
      core.setFailed(
        `ContractGuard found issues: ${report.summary.breaking} breaking, ${report.summary.warning} warning`,
      );
    } else {
      core.info("ContractGuard clean");
    }
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

void run();
