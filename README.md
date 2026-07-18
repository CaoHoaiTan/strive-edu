# Strive Dev — Mission Control

Next.js app for tracking PMP and PSPO exam preparation. The original single-file dashboard was split into:

- `app/globals.css` — extracted styles
- `app/legacy/body-markup.js` — original markup, rendered via `dangerouslySetInnerHTML`
- `app/legacy/init-mission-control.js` — original vanilla JS logic (state, charts, storage), run once on mount
- `app/page.js` — client component wiring the two together

Using Next.js (App Router) makes it straightforward to add API routes or a backend later without restructuring the frontend.

## Develop

```
npm install
npm run dev
```

## Deploy

Push to `main` and connect the repo on Vercel (auto-detects Next.js), or run:

```
npx vercel --prod
```
