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

## Testing

Tests run in Node by default. A test for a client-side script (anything that touches `document` or
`window`) opts into a [happy-dom](https://github.com/capricorn86/happy-dom) DOM by starting its file
with `// @vitest-environment happy-dom`; see `src/components/theme/toggle.test.ts`. Put the
script's logic in an exported function the page's `<script>` calls, render the markup it acts on into
`document.body`, and assert on the resulting DOM. The Astro container (`createContainer()`) can't
render components under happy-dom (it fails with `NoMatchingRenderer`), so write an `.astro`
component's markup into the test as a string, as that test does.

## Base path

The site is deployed under `/Portfolio` (see `base` in `astro.config.mjs`). Build internal links and
asset URLs with `withBase()` from `src/lib/url.ts` rather than hard-coding a leading `/`.

## SEO and link previews

`Base.astro` gives every page a canonical link, Open Graph and `twitter:card` tags, the favicons and
a link to the sitemap. Pages pass their `title` and `description`, and may pass an `image`
(`{ src, alt }`: an `astro:assets` image, a site path or an absolute URL) to preview in place of the site card; a
featured project page passes a PNG (a JPEG for a JPEG source) of its `image`, at most 1200px wide,
when the entry has one, since crawlers render AVIF and WebP unevenly. A project `image` can't be an
SVG, which no crawler renders and the build won't rasterize (`image.dangerouslyProcessSVG` stays
off): export a PNG. The canonical URL is the page's own
path on `site`; other absolute URLs, such as the preview image's, come from `absoluteUrl()` in
`src/lib/url.ts`, which joins `site` and `base`. `@astrojs/sitemap` writes
`sitemap-index.xml` on build. `trailingSlash: 'always'` keeps each page at one URL, `/Portfolio/`,
in the sitemap and the canonical link.

Search engines won't find the sitemap by themselves: a project site can't serve the domain-root
`robots.txt` that would name it, and crawlers ignore `<link rel="sitemap">`. Submit
`https://thundernerd.github.io/Portfolio/sitemap-index.xml` once in Google Search Console (and
Bing Webmaster Tools).

The link-preview image `public/og.png` (1200x630) is rendered from `assets/og.svg`, and the favicons
from `public/favicon.svg`. After editing either SVG, re-render the images with
[resvg](https://github.com/linebender/resvg) and ImageMagick:

```sh
resvg assets/og.svg public/og.png
resvg -w 180 -h 180 public/favicon.svg public/apple-touch-icon.png
for s in 16 32 48; do resvg -w $s -h $s public/favicon.svg /tmp/favicon-$s.png; done
magick /tmp/favicon-16.png /tmp/favicon-32.png /tmp/favicon-48.png public/favicon.ico
```

`og.svg` sets its text in JetBrains Mono and Noto Sans, so install those fonts before rendering it.

## GitHub stats

`npm run build` first runs `scripts/fetch-github.mjs` (the `prebuild` step), which fetches the star
count, primary language and archived flag of every `repo` in `src/content/` from the GitHub API
into `src/data/github-stats.json` (gitignored). Read them in pages with `repoStats()` from
`src/lib/github-stats.ts`. No token is needed; set `GITHUB_TOKEN` to raise the rate limit. A repo
that can't be fetched (offline, rate-limited, not found) falls back to the entry's frontmatter
`stars` and `archived`, and so does every repo under `npm run dev`, which doesn't run the fetcher. So
a repo archived on GitHub gets its "Archived" label on the next build without a frontmatter change;
keep `archived` in the frontmatter up to date anyway, as the fallback. The language falls back to
the first of the entry's `tags` that is a programming language (`TAG_LANGUAGES` in
`src/lib/github-stats.ts`) when the repo wasn't fetched or GitHub reports none. Project cards always
show the hand-written `blurb`.

## Content TODOs

Facts in `src/content/games/` and `src/content/projects/` that still need confirming are marked
`TODO`, in a frontmatter value (`studio: 'TODO: studio'`), a YAML comment or the body. HTML comments
in an entry's Markdown body (`<!-- TODO(Christiaan): ... -->`) are dropped when it is rendered
(`src/lib/strip-html-comments.ts`), so notes kept there don't reach the built pages' source. The launch
guard in `src/content/no-todos.test.ts` fails on any of them and lists each file, line and field. It
is skipped by default so CI and preview deploys keep passing while content is being filled in; run it
on demand with `CHECK_TODOS=1 npm test`. The guard also covers the home page's contact links in
`src/components/home/profile.ts`: a link whose `href` is a `TODO` shows as "to be confirmed",
without a link, until it is filled in. Before launch, once that passes, remove the
`skipIf(!process.env.CHECK_TODOS)` so the guard runs on every `npm test` and in CI.

## Deploy

`.github/workflows/deploy.yml` runs `npm run check`, `npm test` and `npm run build` on pushes to `main` and on pull requests
(using [`withastro/action`](https://github.com/withastro/action)). Pushes to `main` then publish
`dist/` with `actions/deploy-pages`. The repository's Pages source must be set to **GitHub Actions**
(Settings → Pages).

## Layout and style

Pages render inside `src/layouts/Base.astro`, which owns the document, the header (brand, section
navigation and light/dark toggle) and the footer, and loads the site's stylesheet,
`src/styles/global.css`. The style is the minimal one chosen in #12: its rules are scoped under the
`.site` class on `<html>`, and its own classes share the `site-` prefix. The home page (`/`) is
`src/components/home/Home.astro`. Its sections (anchor id, nav label, heading, order) are listed once in
`homeSections` (`src/components/home/sections.ts`), which both the header nav and the home page read:
add a section there and give it content in `Home.astro`, where the type checker asks for it.
In order they are released games, featured projects, Zeepkist mods, Unity plugins, tools and about &
contact; each project `kind` in `src/content/projects/` has its section. The tools section has
`onlyWithKind: 'tool'`, so it and its nav link only appear once a project has `kind: tool`
(`isShown()`).
Each game has a page at `/games/<entry id>/` (`src/pages/games/[slug].astro`), which the game cards on
the home page link to. Its content is `src/components/game/GamePage.astro`: the facts and store
links, the trailer (embedded from `youtube-nocookie.com` when it is a YouTube link, linked
otherwise), the entry's Markdown body under "What I did", its `tech` and a gallery of its
`screenshots` (each an image next to the entry, with `alt` text). While the body still has a
`TODO` in it, the page shows "Write-up coming soon." in its place. The about & contact section's
avatar (`src/assets/avatar.jpg`) and contact links (GitHub, LinkedIn, email, CV) are set in
`profile` (`src/components/home/profile.ts`); put a CV PDF in `public/` and link it by its site
path (`cv.pdf`). The
toggle lives in `src/components/theme/` and remembers the visitor's pick in `localStorage` under
`portfolio-theme`.

## Featured project pages

Every `featured` project in `src/content/projects/` gets a page at `/projects/<entry id>/`
(`src/pages/projects/[slug].astro`), and its card in the home page's featured section links there. The
page shows the title, blurb, language, tags, star count and repo link (from `repoStats()`, as on the
cards), the frontmatter `image` when there is one, and the entry's Markdown body as a README-style
description; write that body for the page. The other kinds have no pages.

## Section components

`src/components/` holds the shared, unstyled building blocks the pages compose:
`Hero`, `GameCard`, `GameFacts`, `ProjectCard`, `CollectionGrid` and `Contact`. They render semantic markup with
BEM-style classes (`.hero__title`, `.project-card__stars`, ...) and only structural CSS (layout,
list resets) inside `@layer components`, so any unlayered layout CSS wins over it regardless of
Astro's scoping attributes: restyle them with plain class selectors or the custom properties each
component documents (for example `--grid-min`, `--card-gap`).
Link props take a site path (resolved with `withBase()`), an absolute URL or a `#fragment`.
`Contact` also takes an optional `avatar` image, marks a link with `download: true` (a CV) with the
`download` attribute, and shows a link without an `href` as plain text.
`GameFacts` renders a game's fact rows (Role, Studio, Year and, when given, Platforms) inside the
caller's `<dl>`, under the caller's BEM block (`game-card` or `game-page`); `GameCard` and the game
page both use it, so add or change a fact there.
Mark the main `Hero` action with `primary: true` to give it `.hero__action--primary`.

`GameCard` and `ProjectCard` take two named slots: `media` replaces the cover or image (for example
with a trailer embed), wrapped in `.game-card__media` / `.project-card__media`, and `extra` renders
after the blurb (for example more repo stats). Fill them directly
(`<Fragment slot="extra">...</Fragment>`), or from a `CollectionGrid` with the `itemMedia` and
`itemExtra` props, which return trusted HTML per entry (or `undefined` to leave the slot empty).
