## Checks

Before committing, run `npm test` (Vitest), `npm run check` (type-check via `astro check`) and
`npm run build`; all must pass.

## Base path

The site is served from `https://thundernerd.github.io/Portfolio/` (`base: '/Portfolio'` in
`astro.config.mjs`). Build every internal link and asset URL with `withBase()` from
`src/lib/url.ts` (for example `withBase('favicon.svg')`); never hard-code a root-relative `/...` path
or concatenate `import.meta.env.BASE_URL` by hand, since it has no trailing `/`.

## Development

When starting the dev server, use background mode:

```
npm run dev -- --background
```

Manage the background server with `npx astro dev stop`, `npx astro dev status`, and `npx astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
