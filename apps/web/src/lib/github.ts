import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

export function getAppOctokit(): Octokit {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY are required");
  }
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });
}

export function getInstallationOctokit(installationId: number): Octokit {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY are required");
  }
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });
}

export async function upsertPrComment(options: {
  installationId: number;
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
  marker?: string;
}): Promise<void> {
  const marker = options.marker ?? "<!-- contractguard-report -->";
  const octokit = getInstallationOctokit(options.installationId);
  const { data: comments } = await octokit.issues.listComments({
    owner: options.owner,
    repo: options.repo,
    issue_number: options.issueNumber,
    per_page: 100,
  });
  const existing = comments.find((c) => c.body?.includes(marker));
  if (existing) {
    await octokit.issues.updateComment({
      owner: options.owner,
      repo: options.repo,
      comment_id: existing.id,
      body: options.body,
    });
  } else {
    await octokit.issues.createComment({
      owner: options.owner,
      repo: options.repo,
      issue_number: options.issueNumber,
      body: options.body,
    });
  }
}
