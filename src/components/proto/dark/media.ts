import type { CollectionEntry } from 'astro:content';

/**
 * Media for the `/proto/dark` cards, as trusted HTML for their `media` slot (see `CollectionGrid`'s
 * `itemMedia`): a click-to-play poster for a YouTube trailer, or a generated initials tile when an
 * entry has no art yet. `undefined` leaves the card's own cover in place.
 */

type Entry = CollectionEntry<'games'> | CollectionEntry<'projects'>;

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com']);
const VIDEO_ID = /^[\w-]{11}$/;

/** The video id of a YouTube watch, share, embed or Shorts URL; `undefined` for anything else. */
export function youTubeId(url: string): string | undefined {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return undefined;
	}
	if (!YOUTUBE_HOSTS.has(parsed.hostname)) return undefined;
	const [first, second] = parsed.pathname.split('/').filter(Boolean);
	const id =
		parsed.hostname === 'youtu.be'
			? first
			: first === 'watch'
				? parsed.searchParams.get('v')
				: first === 'embed' || first === 'shorts'
					? second
					: undefined;
	return id && VIDEO_ID.test(id) ? id : undefined;
}

/** The privacy-enhanced embed of a YouTube video, autoplaying because it loads on a click. */
export function embedUrl(id: string): string {
	return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

const escapeHtml = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A monogram: a short one-word title whole, otherwise the first letters of its first and last words. */
function initials(title: string): string {
	const words = title.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
	if (words.length === 0) return '?';
	if (words.length === 1) return words[0].length <= 4 ? words[0].toUpperCase() : words[0][0].toUpperCase();
	return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** A stable hue (0–359) for an id (FNV-1a), so each tile keeps its colour between builds. */
function hueOf(id: string): number {
	let hash = 0x811c9dc5;
	for (const char of id) {
		hash ^= char.codePointAt(0)!;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash % 360;
}

function tile(entry: Entry): string {
	return `<div class="dark-tile" style="--tile-hue: ${hueOf(entry.id)}" aria-hidden="true"><span class="dark-tile__mark">${escapeHtml(initials(entry.data.title))}</span></div>`;
}

function trailerPoster(entry: CollectionEntry<'games'>, id: string): string {
	const poster = entry.data.cover?.src ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
	const label = escapeHtml(`Play the ${entry.data.title} trailer`);
	return (
		`<button type="button" class="dark-trailer" data-youtube-id="${id}" aria-label="${label}">` +
		`<img class="dark-trailer__poster" src="${escapeHtml(poster)}" alt="" loading="lazy" decoding="async" />` +
		`<span class="dark-trailer__play" aria-hidden="true"></span>` +
		`</button>`
	);
}

/** The `media` slot HTML for an entry's card, or `undefined` to keep its own cover or image. */
export function cardMedia(entry: Entry): string | undefined {
	if (entry.collection === 'games') {
		const id = entry.data.trailer && youTubeId(entry.data.trailer);
		if (id) return trailerPoster(entry, id);
		if (entry.data.cover) return undefined;
	} else if (entry.data.image) {
		return undefined;
	}
	return tile(entry);
}
