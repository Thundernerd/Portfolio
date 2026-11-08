import type { CollectionEntry } from 'astro:content';

/** An entry of either collection, as the `/proto/dark` cards take them. */
export type Entry = CollectionEntry<'games'> | CollectionEntry<'projects'>;

const isTodo = (value: unknown) => typeof value === 'string' && /\bTODO\b/.test(value);

/**
 * A copy of `entry` without the frontmatter text still marked `TODO`: such a text field is emptied
 * and such a list item dropped, so `/proto/dark` shows an unconfirmed fact as absent (its styles hide
 * the empty field) rather than printing the placeholder.
 */
export function withoutTodos<E extends Entry>(entry: E): E {
	const confirmed = (value: unknown) =>
		isTodo(value) ? '' : Array.isArray(value) ? value.filter((item) => !isTodo(item)) : value;
	const data = Object.fromEntries(Object.entries(entry.data).map(([key, value]) => [key, confirmed(value)]));
	return { ...entry, data } as E;
}
