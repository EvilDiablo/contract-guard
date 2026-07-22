import { minimatch } from "minimatch";

/** Normalize a JSON path like `$.user.created_at` or `user.created_at` to dot segments. */
export function normalizePath(path: string): string {
  return path
    .replace(/^\$\.?/, "")
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/^\./, "");
}

/** Join path segments into a dotted path. */
export function joinPath(segments: string[]): string {
  return segments.join(".");
}

/**
 * Returns true if the path matches any ignore glob.
 * Supports patterns like `*.created_at`, `requestId`, `items.*.id`.
 */
export function shouldIgnorePath(path: string, ignorePaths: string[] = []): boolean {
  if (ignorePaths.length === 0) return false;
  const normalized = normalizePath(path);
  const segments = normalized.split(".").filter(Boolean);

  for (const pattern of ignorePaths) {
    if (minimatch(normalized, pattern, { dot: true })) {
      return true;
    }
    // Also match bare leaf names: pattern `created_at` matches `foo.created_at`
    if (!pattern.includes("*") && !pattern.includes(".") && !pattern.includes("/")) {
      if (segments[segments.length - 1] === pattern) {
        return true;
      }
    }
    // Match `*.created_at` against any depth leaf
    if (pattern.startsWith("*.") && segments[segments.length - 1] === pattern.slice(2)) {
      return true;
    }
  }
  return false;
}
