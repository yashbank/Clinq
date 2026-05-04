# UI assets

Brand and background media live under `public/`:

- `public/logo/logo.jpg` — app logo (source was raster; use this with `next/image`).
- `public/background/bg-video.mp4` — marketing hero background.
- `public/background/bg-global.mp4` — site-wide ambient background.
- `public/background/bg-image.png` — poster / video fallback (generated from logo for a neutral plate).

Do not commit large replacement files here; drop them in `public/` and reference by path.
