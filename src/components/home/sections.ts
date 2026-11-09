/**
 * The sections of the home page, in page order: the anchor `id` of each section, its label in the
 * header navigation (`Base.astro`) and its heading on the page (`Home.astro`). Both read this list,
 * so adding, renaming or reordering a section here changes the nav and the page together.
 */
export interface HomeSection {
	/** The section's anchor, linked from the nav as `#<id>`. */
	id: string;
	/** The section's label in the header navigation. */
	nav: string;
	/** The section's heading on the home page. */
	title: string;
}

export const homeSections = [
	{ id: 'games', nav: 'games', title: 'Released games' },
	{ id: 'featured', nav: 'projects', title: 'Featured projects' },
	{ id: 'zeepkist-mods', nav: 'mods', title: 'Zeepkist mods' },
	{ id: 'unity-plugins', nav: 'plugins', title: 'Unity plugins' },
	{ id: 'contact', nav: 'contact', title: 'About & contact' },
] as const satisfies readonly HomeSection[];

export type HomeSectionId = (typeof homeSections)[number]['id'];
