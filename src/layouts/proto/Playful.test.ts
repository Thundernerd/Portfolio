import { beforeEach, describe, expect, it } from 'vitest';
import Playful from './Playful.astro';
import { type AstroContainer, createContainer, fixtureImage, gameEntry, projectEntry } from '../../components/test-fixtures';

const props = {
	games: [gameEntry({ title: 'Good Job!' }, 'good-job'), gameEntry({ title: 'FRU', year: undefined }, 'fru')],
	featured: [projectEntry({ title: 'Zeepkist GTR', kind: 'featured' }, 'zeepkist-gtr')],
	mods: [
		projectEntry({ title: 'RTM', kind: 'zeepkist-mod' }, 'zeepkist-rtm'),
		projectEntry({ title: 'WASD', kind: 'zeepkist-mod' }, 'zeepkist-wasd'),
	],
	plugins: [projectEntry({ title: 'ExtendedEvent', kind: 'unity-plugin' }, 'extended-event')],
};

describe('Playful prototype layout', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});
	const render = (overrides: Record<string, unknown> = {}) =>
		container.renderToString(Playful, { props: { ...props, ...overrides } });

	it('renders the hero and then each section in the agreed order', async () => {
		const html = await render();
		const order = ['class="hero"', 'id="games"', 'id="featured"', 'id="zeepkist-mods"', 'id="unity-plugins"', 'id="contact"'];
		const positions = order.map((marker) => html.indexOf(marker));
		expect(positions.every((p) => p >= 0)).toBe(true);
		expect(positions).toEqual([...positions].sort((a, b) => a - b));
	});

	it('renders a card for every entry of every collection', async () => {
		const html = await render();
		expect(html.match(/<article class="game-card"/g)).toHaveLength(2);
		expect(html.match(/<article class="project-card"/g)).toHaveLength(4);
		for (const title of ['Good Job!', 'FRU', 'Zeepkist GTR', 'RTM', 'WASD', 'ExtendedEvent']) {
			expect(html).toContain(title);
		}
	});

	it('is a full document with the page heading and a base-prefixed favicon', async () => {
		const html = await render();
		expect(html).toMatch(/<html lang="en"/);
		expect(html).toMatch(/<h1[^>]*>/);
		expect(html).toContain('href="/Portfolio/favicon.svg"');
	});

	it('gives a game without a cover a generated title tile in place of key art', async () => {
		const html = await render({ games: [gameEntry({ title: 'Nailed It! Baking Bash' }, 'nailed-it')] });
		expect(html).toMatch(/<div class="game-card__media"[^>]*>\s*<div class="pf-tile"[^>]*aria-hidden="true"[^>]*>[\s\S]*?NB/);
		expect(html).not.toMatch(/<img/);
	});

	it('keeps the real cover when a game has one', async () => {
		const html = await render({ games: [gameEntry({ cover: fixtureImage as never }, 'good-job')] });
		expect(html).not.toMatch(/<div class="game-card__media"/);
		expect(html).toMatch(/<img[^>]*class="game-card__cover/);
	});

	it('gives featured projects without an image a tile, but keeps the mod and plugin lists compact', async () => {
		const html = await render();
		expect(html.match(/class="pf-tile"/g)).toHaveLength(3);
		expect(html).toMatch(/<div class="project-card__media"[^>]*>\s*<div class="pf-tile"[\s\S]*?ZG/);
	});

	it('never shows TODO placeholders: an unconfirmed studio reads as to be announced', async () => {
		const html = await render({ games: [gameEntry({ studio: 'TODO: studio' }, 'fru')] });
		expect(html).not.toContain('TODO');
		expect(html).toMatch(/<dd class="game-card__studio"[^>]*>To be announced<\/dd>/);
	});

	it('swaps a TODO blurb for the first finished paragraph of the entry body', async () => {
		const game = {
			...gameEntry({ blurb: 'TODO: one-line description of FRU.' }, 'fru'),
			body: 'I was a co-founder and programmer on FRU.\n\nTODO: describe what I built on FRU.\n',
		};
		const html = await render({ games: [game] });
		expect(html).not.toContain('TODO');
		expect(html).toMatch(/<p class="game-card__blurb"[^>]*>I was a co-founder and programmer on FRU.<\/p>/);
	});

	it('puts the playable kart scene in the hero with its controls explained and a pause button', async () => {
		const html = await render();
		const hero = html.slice(html.indexOf('class="hero"'), html.indexOf('id="games"'));
		expect(hero).toMatch(/<canvas[^>]*role="img"[^>]*aria-label="[^"]+"/);
		expect(hero).toMatch(/<button[^>]*aria-pressed="false"[^>]*>[\s\S]*?Pause/);
		expect(hero).toMatch(/arrow keys/i);
	});

	it('has a polite live region to announce the score and the easter egg', async () => {
		const html = await render();
		expect(html).toMatch(/<[^>]*aria-live="polite"/);
	});

	it('opens each collection with a numbered stage readout of its size and star total', async () => {
		const html = await render({
			mods: [
				projectEntry({ title: 'RTM', kind: 'zeepkist-mod', stars: 4 }, 'zeepkist-rtm'),
				projectEntry({ title: 'WASD', kind: 'zeepkist-mod', stars: 3 }, 'zeepkist-wasd'),
			],
		});
		const readout = (id: string) => {
			const section = html.slice(html.indexOf(`id="${id}"`));
			return /<p class="pf-hud"[^>]*data-stage="([^"]+)"[^>]*>([\s\S]*?)<\/p>/.exec(section)!;
		};
		expect(readout('games')[1]).toBe('Stage 1');
		expect(readout('games')[2]).toContain('2 titles shipped');
		expect(readout('zeepkist-mods')[1]).toBe('Stage 3');
		expect(readout('zeepkist-mods')[2]).toMatch(/2 mods[\s\S]*7 stars/);
		expect(readout('unity-plugins')[2]).toContain('1 plugin<');
	});
});
