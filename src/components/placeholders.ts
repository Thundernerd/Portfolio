import type { CollectionEntry } from 'astro:content';
import { hasTodo } from '../content/todos';
import type { ContactEntry, ContactLink } from './types';

/** Whether `value` holds a `TODO`, matched as the content guard in `src/content/todos.ts` does. */
export const isTodo = hasTodo;

/** Stands in for a fact that isn't confirmed yet. */
const TO_BE_CONFIRMED = 'To be confirmed';
/** Stands in for a description that isn't written yet. */
export const WRITE_UP_PENDING = 'Write-up coming soon.';

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

/**
 * A rendered Markdown write-up without the paragraphs, headings and list items that still hold a
 * `TODO` (and the lists that leaves empty), so its confirmed sentences can go live on their own.
 * `undefined` when nothing is left to show.
 */
export function presentableWriteUp(html: string): string | undefined {
	const filled = html
		.replace(/<(p|li|h[1-6])\b[^>]*>[\s\S]*?<\/\1>/g, (block) => (isTodo(block) ? '' : block))
		.replace(/<(ul|ol)\b[^>]*>\s*<\/\1>/g, '');
	return filled.replace(/<[^>]*>/g, '').trim() === '' ? undefined : filled;
}

/** The contact link, or for a `TODO` target, its label marked as still to be confirmed, without a link. */
export function presentableContactLink(link: ContactLink): ContactEntry {
	return isTodo(link.href) ? { label: `${link.label} · ${TO_BE_CONFIRMED.toLowerCase()}` } : link;
}
