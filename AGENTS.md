## Checks

Before committing, run `npm run check` (type-check via `astro check`) and `npm run build`; both must pass.

## Base path

The site is served from `https://thundernerd.github.io/Portfolio/` (`base: '/Portfolio'` in
`astro.config.mjs`). Build internal links and asset URLs from `import.meta.env.BASE_URL`; never
hard-code a root-relative `/...` path.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
