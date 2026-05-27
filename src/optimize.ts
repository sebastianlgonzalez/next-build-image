import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { log } from "./logger.js";
import { formatBytes, scanDir } from "./utils.js";
import { loadManifest, saveManifest, hashFile } from "./manifest.js";
import type { Config, Manifest } from "./types.js";

export async function runOptimize(config: Config): Promise<void> {
  const { dir, out, format, quality, extensions, widths } = config;

  const absDir = path.resolve(process.cwd(), dir);
  const absOut = path.resolve(process.cwd(), out);

  if (!fs.existsSync(absDir)) {
    log.warn(`next-build-image: source directory not found (${absDir}), skipping.`);
    return;
  }

  const files = scanDir(absDir, extensions);

  log.info(`next-build-image: scanning ${absDir} ...`);

  if (files.length === 0) {
    log.warn("next-build-image: no images found, skipping.");
    return;
  }

  log.info(`next-build-image: found ${files.length} image(s)`);

  const manifest: Manifest = loadManifest(absOut);
  let processed = 0;
  let skipped = 0;
  let totalSaved = 0;

  for (const file of files) {
    const inputPath = path.join(absDir, file);
    const parsed = path.parse(file);

    const hash = hashFile(inputPath);
    const existing = manifest[file];

    if (existing?.hash === hash) {
      log.dim(`  unchanged  ${file}`);
      skipped++;
      continue;
    }

    const metadata = await sharp(inputPath).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(`Could not read dimensions for ${file}`);
    }

    const aspectRatio = metadata.width / metadata.height;

    const sourceWidth = metadata.width;
    const eligibleWidths = widths.filter((w) => w <= sourceWidth);
    const outputs: string[] = [];

    if (eligibleWidths.length === 0) {
      const outFile = path.join(absOut, parsed.dir, `${parsed.name}.${format}`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      const inputSize = fs.statSync(inputPath).size;
      await sharp(inputPath)[format]({ quality }).toFile(outFile);
      const outputSize = fs.statSync(outFile).size;
      totalSaved += inputSize - outputSize;
      outputs.push(outFile);
      log.success(`  ✓  ${file} → ${parsed.name}.${format}  (${formatBytes(inputSize)} → ${formatBytes(outputSize)})`);
      manifest[file] = { hash, outputs, resized: false, aspectRatio }; // changed: added aspectRatio
      processed++;
      continue;
    }

    for (const width of eligibleWidths) {
      const outFile = path.join(absOut, parsed.dir, `${parsed.name}-${width}.${format}`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      const inputSize = fs.statSync(inputPath).size;
      await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        [format]({ quality })
        .toFile(outFile);
      const outputSize = fs.statSync(outFile).size;
      totalSaved += inputSize - outputSize;
      outputs.push(outFile);
      log.success(`  ✓  ${file} → ${parsed.name}-${width}.${format}  (${formatBytes(inputSize)} → ${formatBytes(outputSize)})`);
    }

    manifest[file] = { hash, outputs, aspectRatio }; // changed: added aspectRatio
    processed++;
  }

  saveManifest(absOut, manifest);
  log.info(`next-build-image: done — ${processed} optimized, ${skipped} unchanged, ${formatBytes(Math.max(0, totalSaved))} saved.\n`);
}