/** Normalize key for fuzzy comparison: snake_case / camelCase / kebab → tokens. */
export function tokenizeKey(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-.\s]+/g, "_")
    .toLowerCase()
    .split("_")
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}

/** Similarity score 0–1 between two keys. */
export function keySimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const ta = tokenizeKey(a).join("");
  const tb = tokenizeKey(b).join("");
  if (ta === tb) return 0.95;
  const maxLen = Math.max(ta.length, tb.length, 1);
  const dist = levenshtein(ta, tb);
  return 1 - dist / maxLen;
}

export interface RenamePair {
  from: string;
  to: string;
  score: number;
}

/**
 * Greedy match of removed keys → added keys by similarity.
 * Only returns pairs above threshold (default 0.7).
 */
export function suggestRenames(
  removed: string[],
  added: string[],
  threshold = 0.7,
): RenamePair[] {
  const pairs: RenamePair[] = [];
  const usedAdded = new Set<string>();
  const candidates: RenamePair[] = [];

  for (const from of removed) {
    for (const to of added) {
      const score = keySimilarity(from, to);
      if (score >= threshold) {
        candidates.push({ from, to, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const usedFrom = new Set<string>();
  for (const pair of candidates) {
    if (usedFrom.has(pair.from) || usedAdded.has(pair.to)) continue;
    usedFrom.add(pair.from);
    usedAdded.add(pair.to);
    pairs.push(pair);
  }
  return pairs;
}
