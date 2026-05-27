# next-build-image

Pre-builds optimized WebP/AVIF images from your `public` directory at build time. Uses a custom Next.js image loader to serve them.

## Install

```bash
npm install next-build-image
```

## Setup

Add to `next.config.ts`:

```ts
import { withBuildImage } from "next-build-image";

export default withBuildImage()(nextConfig);
```

### 1. Initialize

Run `init` to create a config file in your project root:

```bash
npx next-build-image init
```

This creates `next-build-image.config.json` with the default options. See [Configuration](#configuration) for all available options. You can skip this step if the defaults work for you.

### 2. Optimize

The `optimize` command scans your `public` directory and generates optimized images. Add it to your `prebuild` script so it runs automatically before every build:

```json
{
  "scripts": {
    "prebuild": "next-build-image optimize",
    "dev": "next dev",
    "build": "next build"
  }
}
```

In development, original images are served by Next.js natively. If you want optimized images in development as well, add it to `predev`:

```json
{
  "scripts": {
    "predev": "next-build-image optimize",
    "prebuild": "next-build-image optimize",
    "dev": "next dev",
    "build": "next build"
  }
}
```

You can also run it manually at any time:

```bash
npx next-build-image optimize
```

## Configuration

```json
{
  "dir": "./public",
  "out": "./public/optimized",
  "format": "webp",
  "quality": 80,
  "extensions": ["jpg", "jpeg", "png"],
  "widths": [640, 1080, 1920]
}
```

| Option | Default | Description |
|---|---|---|
| `dir` | `./public` | Directory to scan |
| `out` | `./public/optimized` | Output directory |
| `format` | `webp` | Output format — `webp` or `avif` |
| `quality` | `80` | Sharp quality 1–100 |
| `extensions` | `["jpg","jpeg","png"]` | Extensions to process |
| `widths` | `[640, 1080, 1920]` | Widths to generate per image |

Options can also be passed directly to `withBuildImage`:

```ts
export default withBuildImage({ format: "avif", quality: 85 })(nextConfig);
```

## Aspect ratios

After running `optimize`, each image's aspect ratio is accessible at runtime:

```ts
import { getAspectRatio } from "next-build-image/meta";

const ratio = getAspectRatio("/images/hero.jpg"); // 1.777
```

## CLI

```bash
next-build-image init      # Create config file
next-build-image optimize  # Run optimization
```