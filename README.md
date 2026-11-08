# Portfolio

Personal portfolio site, built with [Astro](https://astro.build) and served from GitHub Pages at
<https://thundernerd.github.io/Portfolio/>.

## Commands

Run from the repo root (Node `>=22.23.4`):

| Command           | Action                                                  |
| :---------------- | :------------------------------------------------------ |
| `npm install`     | Install dependencies                                    |
| `npm run dev`     | Start the dev server at `localhost:4321/Portfolio/`     |
| `npm run check`   | Type-check `.astro` and TypeScript files (`astro check`) |
| `npm test`        | Run the unit tests once (Vitest)                        |
| `npm run build`   | Build the production site to `./dist/`                  |
| `npm run preview` | Preview the production build locally                    |

## Base path

The site is deployed under `/Portfolio` (see `base` in `astro.config.mjs`). Build internal links and
asset URLs with `withBase()` from `src/lib/url.ts` rather than hard-coding a leading `/`.

## Deploy

`.github/workflows/deploy.yml` runs `npm run check`, `npm test` and `npm run build` on pushes to `main` and on pull requests
(using [`withastro/action`](https://github.com/withastro/action)). Pushes to `main` then publish
`dist/` with `actions/deploy-pages`. The repository's Pages source must be set to **GitHub Actions**
(Settings → Pages).
