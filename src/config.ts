import fs from "node:fs";
import path from "node:path";
import type { Config, PluginOptions } from "./types.js";

export const DEFAULTS: Config = {
  dir: "./public",
  out: "./public/optimized",
  format: "webp",
  quality: 80,
  extensions: ["jpg", "jpeg", "png"],
  widths: [640, 1080, 1920],
};

export function loadConfig(overrides: PluginOptions = {}): Config {
  const configPath = path.resolve(process.cwd(), "next-build-image.config.json");

  let fileConfig: PluginOptions = {};
  if (fs.existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8")) as PluginOptions;
    } catch {
      throw new Error("Could not parse next-build-image.config.json");
    }
  }

  return { ...DEFAULTS, ...fileConfig, ...overrides };
}
