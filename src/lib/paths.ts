import type { CollectionEntry } from 'astro:content';

/** The site path of a game's page (`src/pages/games/[slug].astro`), for `withBase()` or a link prop. */
export const gamePath = (id: string) => `games/${id}/`;

/**
 * Whether a project gets a page of its own (`src/pages/projects/[slug].astro`): any project whose
 * Markdown body has a write-up, whatever its kind. HTML comments (notes such as `TODO`s) don't count.
 * The route and `projectPagePath()` both read this.
 */
export const hasPage = (project: CollectionEntry<'projects'>) =>
	(project.body ?? '').replace(/<!--[\s\S]*?-->/g, '').trim() !== '';

/**
 * The site path of a project's page, for `withBase()` or a link prop; `undefined` for a project
 * without one (see `hasPage()`).
 */
export const projectPagePath = (project: CollectionEntry<'projects'>) =>
	hasPage(project) ? `projects/${project.id}/` : undefined;
