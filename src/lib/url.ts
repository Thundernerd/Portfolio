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
