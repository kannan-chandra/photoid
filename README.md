# Passport Photo Maker

A frontend-only Astro app for positioning a photo and downloading a printable 4×6-inch JPEG containing six 2×2-inch passport photos. Image processing happens entirely in the browser.

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

The Playwright suite runs the upload, drag, zoom, preview, and JPEG download flow in desktop and mobile Chromium. It verifies that the downloaded sheet is a 1200×1800 JPEG.

## Static deployment

Cloudflare Pages can use `npm run build` with `dist` as the output directory.

For a GitHub Pages project site, supply the repository subpath while building:

```sh
BASE_PATH=/your-repository-name npm run build
```

Set `SITE_URL` to the public origin when canonical URLs are needed. No server runtime or environment secrets are required.
