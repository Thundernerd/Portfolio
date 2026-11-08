import { withBase } from './url';

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
