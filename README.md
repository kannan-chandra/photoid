# Passport Photo Maker

A frontend-only Astro app for positioning a photo and downloading passport images in three formats: a single 600×600 photo, a portrait 4×6 sheet with six photos, or a landscape 4×6 sheet with two photos, 0.5-inch outer margins, and a 1-inch center gap. Generated files are previewed inline and cached for download. JPEG, PNG, WebP, HEIC, and HEIF photos are processed entirely in the browser.

## Local development

```sh
npm install
npm run dev
```

## Verification

```sh
npm run test:e2e
npm run build
```

The Playwright suite runs file selection, drag-and-drop, real HEIC conversion, editing, preview, and all three JPEG download flows in desktop and mobile Chromium. It verifies each downloaded image's filename and exact pixel dimensions.

The HEIC integration-test fixture comes from the MIT-licensed [`heic2any`](https://github.com/alexcorvi/heic2any) project.

## Static deployment

Cloudflare Pages can use `npm run build` with `dist` as the output directory.

For a GitHub Pages project site, supply the repository subpath while building:

```sh
BASE_PATH=/your-repository-name npm run build
```

Set `SITE_URL` to the public origin when canonical URLs are needed. No server runtime or environment secrets are required.
