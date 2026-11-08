import type { CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'games'> | CollectionEntry<'projects'>;

/** Up to three letters standing in for a title: first and last word initials ("Zeepkist GTR" → "ZG"). */
export function initials(title: string): string {
	const words = title
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean);
	if (words.length === 0) return '?';
	if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
	return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** A stable hue (0–359) for a string, so each entry keeps its colour between builds. */
function hueOf(text: string): number {
	let hash = 0;
	for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return hash % 360;
}

/**
 * Generated cover for an entry without key art: a gradient "cartridge" tile with the title's
 * initials, as trusted HTML for a card's `media` slot. `undefined` when the entry has its own art.
 */
export function artTile(entry: Entry): string | undefined {
	const art = entry.collection === 'games' ? entry.data.cover : entry.data.image;
	if (art) return undefined;
	return `<div class="pf-tile" style="--tile-hue: ${hueOf(entry.id)}" aria-hidden="true"><span class="pf-tile__initials">${initials(entry.data.title)}</span></div>`;
}
