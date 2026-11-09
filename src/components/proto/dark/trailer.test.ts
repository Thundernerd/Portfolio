// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { playTrailer } from './trailer';

/** A poster as `cardMedia` renders it, wired to the handler the way the page's script is. */
function renderPoster(): HTMLButtonElement {
	document.body.innerHTML =
		'<div class="card"><button type="button" class="dark-trailer" data-youtube-id="dQw4w9WgXcQ" data-trailer-title="Fru trailer" aria-label="Play the Fru trailer"></button></div>';
	const poster = document.querySelector<HTMLButtonElement>('button.dark-trailer')!;
	poster.addEventListener('click', () => playTrailer(poster));
	return poster;
}

describe('playTrailer', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('replaces the clicked poster with the privacy-enhanced YouTube player', () => {
		renderPoster().click();

		expect(document.querySelector('button.dark-trailer')).toBeNull();
		const frame = document.querySelector('.card > iframe');
		expect(frame?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
	});

	it("titles the player after the poster's trailer title", () => {
		renderPoster().click();

		expect(document.querySelector('iframe')?.title).toBe('Fru trailer');
	});

	it('moves focus to the player', () => {
		renderPoster().click();

		expect(document.activeElement).toBe(document.querySelector('iframe'));
		expect(document.activeElement).not.toBe(document.body);
	});
});
