import type { CollectionEntry } from 'astro:content';

/** The site path of a game's page (`src/pages/games/[slug].astro`), for `withBase()` or a link prop. */
export const gamePath = (id: string) => `games/${id}/`;

/**
 * Whether a project gets a page of its own (`src/pages/projects/[slug].astro`): only the featured
 * ones do. The route and `projectPagePath()` both read this.
 */
export const hasPage = (project: CollectionEntry<'projects'>) => project.data.kind === 'featured';

/**
 * The site path of a project's page, for `withBase()` or a link prop; `undefined` for a project
 * without one (see `hasPage()`).
 */
export const projectPagePath = (project: CollectionEntry<'projects'>) =>
	hasPage(project) ? `projects/${project.id}/` : undefined;
