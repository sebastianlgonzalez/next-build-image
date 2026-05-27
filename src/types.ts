export type ImageFormat = "webp" | "avif";

export interface Config {
  dir: string;
  out: string;
  format: ImageFormat;
  quality: number;
  extensions: string[];
  widths: number[];
}

export type PluginOptions = Partial<Config>;

export interface Manifest {
  [sourcePath: string]: {
    hash: string;
    outputs: string[];
    aspectRatio: number;
		resized?: boolean;
  };
}