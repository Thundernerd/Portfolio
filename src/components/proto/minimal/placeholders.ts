import type { CollectionEntry } from 'astro:content';

/** `TODO` as a whole word, as the content guard in `src/content/todos.ts` matches it. */
const isTodo = (value: string) => /\bTODO\b/.test(value);

const orFallback = (value: string, fallback: string) => (isTodo(value) ? fallback : value);

/** The game with any `TODO` studio, role or blurb shown as a quiet placeholder. */
export function presentableGame(game: CollectionEntry<'games'>): CollectionEntry<'games'> {
	const { studio, role, blurb } = game.data;
	return {
		...game,
		data: {
			...game.data,
			studio: orFallback(studio, 'To be confirmed'),
			role: orFallback(role, 'To be confirmed'),
			blurb: orFallback(blurb, 'Write-up coming soon.'),
		},
	};
}

/** The project with a `TODO` blurb shown as a quiet placeholder. */
export function presentableProject(project: CollectionEntry<'projects'>): CollectionEntry<'projects'> {
	return { ...project, data: { ...project.data, blurb: orFallback(project.data.blurb, 'Write-up coming soon.') } };
}
