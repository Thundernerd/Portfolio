import type { CollectionEntry } from 'astro:content';
import type { ContactEntry, ContactLink } from '../types';

/** `TODO` as a whole word, as the content guard in `src/content/todos.ts` matches it. */
const isTodo = (value: string) => /\bTODO\b/.test(value);

/** Stands in for a fact that isn't confirmed yet. */
const TO_BE_CONFIRMED = 'To be confirmed';
/** Stands in for a description that isn't written yet. */
const WRITE_UP_PENDING = 'Write-up coming soon.';

const orFallback = (value: string, fallback: string) => (isTodo(value) ? fallback : value);

/** The game with any `TODO` studio, role or blurb shown as a quiet placeholder. */
export function presentableGame(game: CollectionEntry<'games'>): CollectionEntry<'games'> {
	const { studio, role, blurb } = game.data;
	return {
		...game,
		data: {
			...game.data,
			studio: orFallback(studio, TO_BE_CONFIRMED),
			role: orFallback(role, TO_BE_CONFIRMED),
			blurb: orFallback(blurb, WRITE_UP_PENDING),
		},
	};
}

/** The project with a `TODO` blurb shown as a quiet placeholder. */
export function presentableProject(project: CollectionEntry<'projects'>): CollectionEntry<'projects'> {
	return { ...project, data: { ...project.data, blurb: orFallback(project.data.blurb, WRITE_UP_PENDING) } };
}

/** The contact link, or for a `TODO` target, its label marked as still to be confirmed, without a link. */
export function presentableContactLink(link: ContactLink): ContactEntry {
	return isTodo(link.href) ? { label: `${link.label} · ${TO_BE_CONFIRMED.toLowerCase()}` } : link;
}
