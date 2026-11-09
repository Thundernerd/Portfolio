import { embedUrl } from './media';

/**
 * Swap a click-to-play trailer poster (a `button.dark-trailer[data-youtube-id]` from `cardMedia`)
 * for the YouTube player, so the player and its scripts load only on demand.
 */
function playTrailer(poster: HTMLButtonElement): void {
	const id = poster.dataset.youtubeId;
	if (!id) return;
	const frame = document.createElement('iframe');
	frame.className = 'dark-trailer__frame';
	frame.src = embedUrl(id);
	frame.title = poster.dataset.trailerTitle ?? 'Trailer';
	frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
	frame.allowFullscreen = true;
	poster.replaceWith(frame);
	frame.focus();
}

/**
 * A document `click` listener that plays the trailer whose poster (or anything inside it) was clicked;
 * other clicks are ignored.
 */
export function onTrailerClick(event: Event): void {
	const poster = (event.target as Element | null)?.closest<HTMLButtonElement>('button.dark-trailer[data-youtube-id]');
	if (poster) playTrailer(poster);
}
