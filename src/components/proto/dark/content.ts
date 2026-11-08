import type { CollectionEntry } from 'astro:content';

const isTodo = (value: unknown) => typeof value === 'string' && /\bTODO\b/.test(value);

/**
 * A copy of `entry` with every frontmatter text still marked `TODO` emptied, so `/proto/dark` shows
 * an unconfirmed fact as absent (its styles hide the empty field) rather than printing the placeholder.
 */
export function withoutTodos<E extends CollectionEntry<'games'> | CollectionEntry<'projects'>>(entry: E): E {
	const data = Object.fromEntries(Object.entries(entry.data).map(([key, value]) => [key, isTodo(value) ? '' : value]));
	return { ...entry, data } as E;
}
