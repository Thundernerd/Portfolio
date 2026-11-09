/**
 * Joins `import.meta.env.BASE_URL` and `path` with exactly one `/` between them.
 *
 * The site is served under a base path (`/Portfolio`), so every internal link and asset URL must be
 * built through this helper. `path` may start with `/` or not; `''` gives the base root with a
 * trailing `/`.
 */
export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
	return `${base}/${path.replace(/^\/+/, '')}`;
}

/**
 * Resolves a link target given as component props.
 *
 * Absolute URLs (`https:`, `mailto:`, protocol-relative `//`) and in-page fragments (`#id`) pass
 * through unchanged; anything else is a path on this site and goes through `withBase()`.
 */
export function resolveHref(href: string): string {
	if (/^([a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return href;
	return withBase(href);
}

/**
 * The full URL of a site path on the deployed site (`site` + base path in `astro.config.mjs`), for
 * places that need an absolute URL: the canonical link, Open Graph tags and the sitemap.
 */
export function absoluteUrl(path: string): string {
	return new URL(withBase(path), import.meta.env.SITE).href;
}
