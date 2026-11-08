import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameCard from './GameCard.astro';
import { fixtureImage, gameEntry } from './test-fixtures';

describe('GameCard', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		vi.stubEnv('BASE_URL', '/Portfolio/');
		container = await AstroContainer.create();
	});
	afterEach(() => vi.unstubAllEnvs());

	const render = (props: Record<string, unknown>) => container.renderToString(GameCard, { props });

	it('renders the title, role, studio, year and blurb', async () => {
		const html = await render({ game: gameEntry() });
		expect(html).toMatch(/<article[^>]*>/);
		expect(html).toMatch(/<h3[^>]*>\s*Good Job!\s*<\/h3>/);
		expect(html).toContain('Programmer');
		expect(html).toContain('Paladin Studios');
		expect(html).toMatch(/<time[^>]*datetime="2020"[^>]*>2020<\/time>/);
		expect(html).toContain('A puzzle game about being the boss’s kid.');
	});

	it('lists every platform', async () => {
		const html = await render({ game: gameEntry({ platforms: ['Nintendo Switch', 'PC'] }) });
		expect(html).toMatch(/<li[^>]*>Nintendo Switch<\/li>\s*<li[^>]*>PC<\/li>/);
	});

	it('links the title to a base-prefixed page when given an href', async () => {
		const html = await render({ game: gameEntry(), href: 'games/good-job/' });
		expect(html).toMatch(/<h3[^>]*>\s*<a[^>]*href="\/Portfolio\/games\/good-job\/"[^>]*>Good Job!<\/a>/);
	});

	it('links to the trailer and each store page when present', async () => {
		expect(await render({ game: gameEntry() })).not.toContain('game-card__links');
		const html = await render({
			game: gameEntry({
				trailer: 'https://www.youtube.com/watch?v=abc',
				storeLinks: [{ label: 'Nintendo eShop', url: 'https://www.nintendo.com/good-job' }],
			}),
		});
		expect(html).toMatch(/<a[^>]*href="https:\/\/www.youtube.com\/watch\?v=abc"[^>]*>Trailer<\/a>/);
		expect(html).toMatch(/<a[^>]*href="https:\/\/www.nintendo.com\/good-job"[^>]*>Nintendo eShop<\/a>/);
	});

	it('renders the cover only when present', async () => {
		expect(await render({ game: gameEntry() })).not.toContain('<img');
		expect(await render({ game: gameEntry({ cover: fixtureImage }) })).toMatch(/<img[^>]*\salt(=""|[\s>])/);
	});
});
