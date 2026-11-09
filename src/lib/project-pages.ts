import type { CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;

/**
 * Which projects get a page of their own (`src/pages/projects/[slug].astro`) and where: the
 * featured ones, at `projects/<entry id>/`. The route and the links to it both read this.
 */
export const hasPage = (project: Project) => project.data.kind === 'featured';

/** The site path of a project's page, for `withBase()` or a card's `href`; `undefined` when it has none. */
export const projectPagePath = (project: Project) => (hasPage(project) ? `projects/${project.id}/` : undefined);
