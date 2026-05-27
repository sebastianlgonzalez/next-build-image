import fs from "node:fs";
import path from "node:path";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function scanDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  const extSet = new Set(extensions.map((e) => e.toLowerCase()));

  function walk(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(current, entry.name));
      } else if (extSet.has(path.extname(entry.name).slice(1).toLowerCase())) {
        results.push(path.relative(dir, path.join(current, entry.name)));
      }
    }
  }

  walk(dir);
  return results;
}
