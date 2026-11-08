import { beforeEach, describe, expect, it } from 'vitest';
import GameCard from './GameCard.astro';
import { type AstroContainer, createContainer, fixtureImage, gameEntry } from './test-fixtures';

describe('GameCard', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = (props: Record<string, unknown>) => container.renderToString(GameCard, { props });

	it('renders the title, role, studio, year and blurb', async () => {
		const html = await render({ game: gameEntry() });
		expect(html).toMatch(/<article[^>]*>/);
		expect(html).toMatch(/<h3[^>]*>\s*Good Job!\s*<\/h3>/);
		expect(html).toMatch(/<dt[^>]*>Role<\/dt>\s*<dd[^>]*>Programmer<\/dd>/);
		expect(html).toMatch(/<dt[^>]*>Studio<\/dt>\s*<dd[^>]*>Paladin Studios<\/dd>/);
		expect(html).toMatch(/<dt[^>]*>Year<\/dt>\s*<dd[^>]*>\s*<time[^>]*datetime="2020"[^>]*>2020<\/time>\s*<\/dd>/);
		expect(html).toContain('A puzzle game about being the boss’s kid.');
	});

	it('leaves out the year when it is not known', async () => {
		const html = await render({ game: gameEntry({ year: undefined }) });
		expect(html).toMatch(/<dt[^>]*>Studio<\/dt>/);
		expect(html).not.toContain('Year');
		expect(html).not.toContain('<time');
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

	it('ties each link to the game title so "Trailer" makes sense out of context', async () => {
		const html = await render({
			game: gameEntry({
				trailer: 'https://www.youtube.com/watch?v=abc',
				storeLinks: [{ label: 'Nintendo eShop', url: 'https://www.nintendo.com/good-job' }],
			}),
		});
		expect(html).toMatch(/<h3[^>]*id="game-good-job-title"/);
		expect(html.match(/<a[^>]*aria-describedby="game-good-job-title"/g)).toHaveLength(2);
	});

	it('renders the cover only when present', async () => {
		expect(await render({ game: gameEntry() })).not.toContain('<img');
		expect(await render({ game: gameEntry({ cover: fixtureImage }) })).toMatch(/<img[^>]*\salt(=""|[\s>])/);
	});

	it('renders slotted media, such as a trailer embed, in place of the cover', async () => {
		const html = await container.renderToString(GameCard, {
			props: { game: gameEntry({ cover: fixtureImage }) },
			slots: { media: '<iframe src="https://www.youtube.com/embed/abc" title="Good Job! trailer"></iframe>' },
		});
		expect(html).not.toContain('<img');
		expect(html).toMatch(/<article[^>]*>\s*<iframe[^>]*src="https:\/\/www.youtube.com\/embed\/abc"/);
	});

	it('renders slotted extra content right after the blurb', async () => {
		const html = await container.renderToString(GameCard, {
			props: { game: gameEntry({ storeLinks: [{ label: 'Nintendo eShop', url: 'https://www.nintendo.com/good-job' }] }) },
			slots: { extra: '<p class="awards">Best Puzzle Game</p>' },
		});
		expect(html).toMatch(/boss’s kid.<\/p>\s*<p class="awards">Best Puzzle Game<\/p>\s*<ul class="game-card__links"/);
	});
});
