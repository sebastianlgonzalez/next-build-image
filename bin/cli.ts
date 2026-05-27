#!/usr/bin/env node
import { init } from "../src/init.js";
import { log } from "../src/logger.js";
import { loadConfig } from "../src/config.js";
import { runOptimize } from "../src/optimize.js";

const [, , command] = process.argv;

if (command === "init") {
  try {
    init();
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
} else if (command === "optimize") {
  try {
    const config = loadConfig();
    await runOptimize(config);
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
} else {
  log.info(`
  next-build-image

  Usage:
    next-build-image init       Create a config file in your project root
    next-build-image optimize   Optimize images in your public directory

  Then add the plugin to next.config.ts — add the optimize command to
  prebuild (and optionally predev) in your package.json.
  `);
}