import type { CollectionEntry } from 'astro:content';

type ProjectKind = CollectionEntry<'projects'>['data']['kind'];

/**
 * The sections of the home page, in page order: the anchor `id` of each section, its label in the
 * header navigation (`Base.astro`) and its heading on the page (`Home.astro`). Both read this list,
 * so adding, renaming or reordering a section here changes the nav and the page together. A section
 * with `onlyWithKind` is left out of both while no project of that kind exists (see `isShown()`).
 */
export interface HomeSection {
	/** The section's anchor, linked as `anchor(id)`. */
	id: string;
	/** The section's label in the header navigation. */
	navLabel: string;
	/** The section's heading on the home page. */
	title: string;
	/** Show the section (and its nav link) only when at least one project of this kind exists. */
	onlyWithKind?: ProjectKind;
}

export const homeSections = [
	{ id: 'games', navLabel: 'games', title: 'Released games' },
	{ id: 'apps', navLabel: 'apps', title: 'Apps', onlyWithKind: 'app' },
	{ id: 'zeepkist-mods', navLabel: 'mods', title: 'Zeepkist mods' },
	{ id: 'unity-plugins', navLabel: 'plugins', title: 'Unity plugins' },
	{ id: 'contact', navLabel: 'contact', title: 'About & contact' },
] as const satisfies readonly HomeSection[];

/**
 * Whether the home page and the nav show this section, given the site's projects: always, unless it
 * is tied to a project kind (`onlyWithKind`) that no project has.
 */
export const isShown = (section: HomeSection, projects: readonly CollectionEntry<'projects'>[]) =>
	section.onlyWithKind === undefined || projects.some((project) => project.data.kind === section.onlyWithKind);

export type HomeSectionId = (typeof homeSections)[number]['id'];

/** The home section that lists each kind of project, which a project's page links back to. */
export const sectionOfKind = {
	'zeepkist-mod': 'zeepkist-mods',
	'unity-plugin': 'unity-plugins',
	app: 'apps',
} as const satisfies Record<ProjectKind, HomeSectionId>;

/** The fragment linking to the home section with this id; typed so a renamed section breaks its links. */
export const anchor = (id: HomeSectionId) => `#${id}`;
