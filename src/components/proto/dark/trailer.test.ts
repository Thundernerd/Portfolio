// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gameEntry } from '../../test-fixtures';
import { cardMedia } from './media';
import { onTrailerClick } from './trailer';

/** A game card's trailer poster, rendered by `cardMedia` as on the page; returns the poster. */
function renderPoster(): HTMLButtonElement {
	const media = cardMedia(gameEntry({ title: 'Fru', trailer: 'https://youtu.be/dQw4w9WgXcQ' }));
	document.body.innerHTML = `<article class="card">${media}</article>`;
	return document.querySelector<HTMLButtonElement>('.card > button')!;
}

describe('onTrailerClick', () => {
	// Wired the way `DarkHome.astro`'s script wires it: one listener for the whole document.
	beforeEach(() => document.addEventListener('click', onTrailerClick));
	afterEach(() => document.removeEventListener('click', onTrailerClick));

	it('replaces the clicked poster with the privacy-enhanced YouTube player', () => {
		renderPoster().click();

		expect(document.querySelector('.card > button')).toBeNull();
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
	});

	it('plays the trailer when the click lands on the poster image', () => {
		renderPoster();

		document.querySelector<HTMLElement>('.card img')!.click();

		expect(document.querySelector('.card > iframe')).not.toBeNull();
	});
});
