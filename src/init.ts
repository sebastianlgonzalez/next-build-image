import fs from "node:fs";
import path from "node:path";
import { log } from "./logger.js";
import { DEFAULTS } from "./config.js";

export function init(): void {
  const configPath = path.resolve(process.cwd(), "next-build-image.config.json");

  if (fs.existsSync(configPath)) {
    log.warn("Config already exists at next-build-image.config.json");
    log.warn("Delete it first if you want to reinitialize.");
    return;
  }

  fs.writeFileSync(configPath, JSON.stringify(DEFAULTS, null, 2) + "\n");

  log.success("Created next-build-image.config.json");
log.info("Add withBuildImage() to next.config.ts and add next-build-image optimize to your prebuild script.");
}
