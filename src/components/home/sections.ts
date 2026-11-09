/**
 * The sections of the home page, in page order: the anchor `id` of each section, its label in the
 * header navigation (`Base.astro`) and its heading on the page (`Home.astro`). Both read this list,
 * so adding, renaming or reordering a section here changes the nav and the page together.
 */
export interface HomeSection {
	/** The section's anchor, linked as `anchor(id)`. */
	id: string;
	/** The section's label in the header navigation. */
	navLabel: string;
	/** The section's heading on the home page. */
	title: string;
}

export const homeSections = [
	{ id: 'games', navLabel: 'games', title: 'Released games' },
	{ id: 'featured', navLabel: 'projects', title: 'Featured projects' },
	{ id: 'zeepkist-mods', navLabel: 'mods', title: 'Zeepkist mods' },
	{ id: 'unity-plugins', navLabel: 'plugins', title: 'Unity plugins' },
	{ id: 'contact', navLabel: 'contact', title: 'About & contact' },
] as const satisfies readonly HomeSection[];

export type HomeSectionId = (typeof homeSections)[number]['id'];

/** The fragment linking to the home section with this id; typed so a renamed section breaks its links. */
export const anchor = (id: HomeSectionId) => `#${id}`;
