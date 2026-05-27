import path from "node:path";
import fs from "node:fs";

import { loadConfig } from "./config.js";
import { loadManifest } from "./manifest.js";
import type { PluginOptions } from "./types.js";

interface WebpackContext {
  isServer: boolean;
  dev: boolean;
}

function buildOptimizedWidths(manifest: ReturnType<typeof loadManifest>): {
  widths: Record<string, number[]>;
  unresized: string[];
  aspectRatios: Record<string, number>;
} {
  const widths: Record<string, number[]> = {};
  const unresized: string[] = [];
  const aspectRatios: Record<string, number> = {}; // added

  for (const [key, value] of Object.entries(manifest)) {
    const normalizedKey = "/" + key.replaceAll("\\", "/");

    aspectRatios[normalizedKey] = value.aspectRatio;

    if (value.resized === false) {
      unresized.push(normalizedKey);
      continue;
    }

    widths[normalizedKey] = value.outputs
      .map((o: string) => {
        const match = o.match(/-(\d+)\.\w+$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((w): w is number => w !== null)
      .sort((a, b) => a - b);
  }

  return { widths, unresized, aspectRatios };
}

function generateLoader(
  outDir: string,
  format: string,
  extensions: string[],
  optimizedWidths: Record<string, number[]>,
  unresized: string[]
): string {
  return [
    `export default function loader({ src, width }) {`,
    `  const outDir = ${JSON.stringify(outDir)};`,
    `  const format = ${JSON.stringify(format)};`,
    `  const extensions = ${JSON.stringify(extensions)};`,
    `  const optimizedWidths = ${JSON.stringify(optimizedWidths)};`,
    `  const unresized = ${JSON.stringify(unresized)};`,
    `  const ext = src.slice(src.lastIndexOf(".") + 1).toLowerCase();`,
    `  if (!extensions.includes(ext)) return src + "?w=" + width;`,
    `  const withoutExt = src.slice(0, src.lastIndexOf("."));`,
    `  const available = optimizedWidths[src];`,
    `  const isUnresized = unresized.includes(src);`,
    `  if (!available && !isUnresized) return src + "?w=" + width;`,
    `  if (isUnresized) return \`\${outDir}\${withoutExt}.\${format}\`;`,
    `  const nearest = available.find(w => w >= width) ?? available[available.length - 1];`,
    `  return \`\${outDir}\${withoutExt}-\${nearest}.\${format}\`;`,
    `}`,
  ].join("\n");
}

function generateMeta(aspectRatios: Record<string, number>): string {
  return [
    `const aspectRatios = ${JSON.stringify(aspectRatios)};`,
    `export function getAspectRatio(src) {`,
    `  return aspectRatios[src];`,
    `}`,
  ].join("\n");
}

export function withBuildImage(pluginOptions: PluginOptions = {}) {
  return function (nextConfig: Record<string, unknown> = {}): Record<string, unknown> {
    const config = loadConfig(pluginOptions);
    const publicOutDir = "/" + path.relative("public", config.out);
    const generatedLoaderPath = path.resolve(process.cwd(), "node_modules/.next-build-image/loader.mjs");
    const generatedMetaPath = path.resolve(process.cwd(), "node_modules/.next-build-image/meta.mjs");

    fs.mkdirSync(path.dirname(generatedLoaderPath), { recursive: true });

    const manifest = loadManifest(path.resolve(process.cwd(), config.out));
    const { widths: optimizedWidths, unresized, aspectRatios } = buildOptimizedWidths(manifest);

    fs.writeFileSync(generatedLoaderPath, generateLoader(publicOutDir, config.format, config.extensions, optimizedWidths, unresized));
    fs.writeFileSync(generatedMetaPath, generateMeta(aspectRatios));

    return {
      ...nextConfig,

      images: {
        ...(nextConfig.images as Record<string, unknown>),
        loaderFile: "node_modules/.next-build-image/loader.mjs",
      },

      webpack(webpackConfig: unknown, context: WebpackContext): unknown {
        const existingWebpack = nextConfig.webpack;
        if (typeof existingWebpack === "function") {
          return (existingWebpack as Function)(webpackConfig, context);
        }
        return webpackConfig;
      },
    };
  };
}