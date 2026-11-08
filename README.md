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

## GitHub stats

`npm run build` first runs `scripts/fetch-github.mjs` (the `prebuild` step), which fetches the star
count and description of every `repo` in `src/content/` from the GitHub API into
`src/data/github-stats.json` (gitignored). Read them in pages with `repoStats()` from
`src/lib/github-stats.ts`. No token is needed; set `GITHUB_TOKEN` to raise the rate limit. A repo that
can't be fetched (offline, rate-limited, not found) falls back to the entry's frontmatter `stars` and
`blurb`, and so does every repo under `npm run dev`, which doesn't run the fetcher.

## Deploy

`.github/workflows/deploy.yml` runs `npm run check`, `npm test` and `npm run build` on pushes to `main` and on pull requests
(using [`withastro/action`](https://github.com/withastro/action)). Pushes to `main` then publish
`dist/` with `actions/deploy-pages`. The repository's Pages source must be set to **GitHub Actions**
(Settings → Pages).

## Section components

`src/components/` holds the shared, unstyled building blocks the pages and style prototypes compose:
`Hero`, `GameCard`, `ProjectCard`, `CollectionGrid` and `Contact`. They render semantic markup with
BEM-style classes (`.hero__title`, `.project-card__stars`, ...) and only structural CSS (layout,
list resets) inside `@layer components`, so any unlayered layout CSS wins over it regardless of
Astro's scoping attributes: restyle them with plain class selectors or the custom properties each
component documents (for example `--grid-min`, `--card-gap`).
Link props take a site path (resolved with `withBase()`), an absolute URL or a `#fragment`.

`GameCard` and `ProjectCard` take two named slots: `media` replaces the cover or image (for example
with a trailer embed), wrapped in `.game-card__media` / `.project-card__media`, and `extra` renders
after the blurb (for example more repo stats). Fill them directly
(`<Fragment slot="extra">...</Fragment>`), or from a `CollectionGrid` with the `itemMedia` and
`itemExtra` props, which return trusted HTML per entry (or `undefined` to leave the slot empty).
