import type { CollectionEntry } from 'astro:content';

/**
 * The letters of a title's monogram: the initials of its first three words, or a one-word title
 * itself when it is three characters or fewer (its first two otherwise).
 */
function initials(title: string): string {
	const words = title.split(/\s+/).map((word) => word.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);
	if (words.length === 1) return words[0].length <= 3 ? words[0] : words[0].slice(0, 2);
	return words
		.slice(0, 3)
		.map((word) => word[0])
		.join('');
}

/** A hue (0-359) derived from `text`, so each entry keeps its own tint from build to build. */
function hueOf(text: string): number {
	let hash = 0;
	for (const char of text) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
	return hash % 360;
}

/**
 * HTML for a game card's `media` slot when the game has no cover yet: a decorative monogram tile
 * tinted per game. `undefined` for a game with a cover, which keeps it.
 */
export function monogramHtml(game: CollectionEntry<'games'>): string | undefined {
	if (game.data.cover) return undefined;
	const letters = initials(game.data.title).toUpperCase();
	return `<span class="mn-monogram" style="--tile-hue: ${hueOf(game.id)}" aria-hidden="true">${letters}</span>`;
}
