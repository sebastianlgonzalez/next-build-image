import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Manifest } from "./types.js";

const MANIFEST_FILE = ".manifest.json";

export function loadManifest(outDir: string): Manifest {
  const manifestPath = path.join(outDir, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
  } catch {
    return {};
  }
}

export function saveManifest(outDir: string, manifest: Manifest): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, MANIFEST_FILE),
    JSON.stringify(manifest, null, 2) + "\n"
  );
}

export function hashFile(filePath: string): string {
  const contents = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(contents).digest("hex");
}
