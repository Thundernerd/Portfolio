import { beforeEach, describe, expect, it } from 'vitest';
import { type AstroContainer, createContainer, fixtureImage, gameEntry, imgTag, largeImage, sizesOf, srcsetWidths } from '../test-fixtures';
import GamePage from './GamePage.astro';

describe('GamePage', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = (props: Record<string, unknown>, slots?: Record<string, string>) =>
		container.renderToString(GamePage, { props, slots });

	it('heads the page with the title, then the role, studio, year and platforms', async () => {
		const html = await render({ game: gameEntry({ platforms: ['Nintendo Switch', 'PC'] }) });
		expect(html).toMatch(/<h1[^>]*>\s*Good Job!\s*<\/h1>/);
		expect(html).toContain('A puzzle game about being the boss’s kid.');
		expect(html).toMatch(/<dt[^>]*>Role<\/dt>\s*<dd[^>]*>Programmer<\/dd>/);
		expect(html).toMatch(/<dt[^>]*>Studio<\/dt>\s*<dd[^>]*>Paladin Studios<\/dd>/);
		expect(html).toMatch(/<dt[^>]*>Year<\/dt>\s*<dd[^>]*>\s*<time[^>]*datetime="2020"[^>]*>2020<\/time>\s*<\/dd>/);
		expect(html).toMatch(/<dt[^>]*>Platforms<\/dt>\s*<dd[^>]*>\s*<ul[^>]*>\s*<li[^>]*>Nintendo Switch<\/li>\s*<li[^>]*>PC<\/li>/);
	});

	it('labels a game that only reached soft launch under its title, and no other', async () => {
		const html = await render({ game: gameEntry({ softLaunchOnly: true }) });
		expect(html).toMatch(/<\/h1>\s*<p class="game-page__status"[^>]*>Soft launch · pulled<\/p>/);
		expect(await render({ game: gameEntry() })).not.toContain('game-page__status');
	});

	it('embeds a YouTube trailer, titled after the game', async () => {
		const html = await render({ game: gameEntry({ trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }) });
		expect(html).toMatch(/<iframe[^>]*src="https:\/\/www.youtube-nocookie.com\/embed\/dQw4w9WgXcQ"/);
		expect(html).toMatch(/<iframe[^>]*title="Good Job! trailer"/);
		expect(html).toMatch(/<iframe[^>]*allowfullscreen/);
	});

	it('links to a trailer it cannot embed, and shows no trailer when there is none', async () => {
		const html = await render({ game: gameEntry({ trailer: 'https://vimeo.com/123456' }) });
		expect(html).not.toContain('<iframe');
		expect(html).toMatch(/<a[^>]*href="https:\/\/vimeo.com\/123456"[^>]*>Watch the trailer<\/a>/);
		const without = await render({ game: gameEntry() });
		expect(without).not.toContain('<iframe');
		expect(without).not.toContain('trailer');
	});

	/** The section with this heading, from its opening tag to its end. */
	const sectionHeaded = (html: string, heading: string) =>
		new RegExp(`<section[^>]*>\\s*<h2[^>]*>${heading}</h2>[\\s\\S]*?</section>`).exec(html)?.[0];

	it('describes what I did on the game with its write-up', async () => {
		const html = await render({ game: gameEntry() }, { default: '<p>I built the level editor.</p>' });
		expect(sectionHeaded(html, 'What I did')).toMatch(/<\/h2>\s*<div[^>]*>\s*<p>I built the level editor.<\/p>/);
	});

	it('leaves out the parts of the write-up that are not filled in yet', async () => {
		const html = await render(
			{ game: gameEntry() },
			{ default: '<p>I worked on it.</p>\n<p>TODO: describe what I built.</p>\n<ul>\n<li>Netcode</li>\n<li>TODO: more</li>\n</ul>' },
		);
		const section = sectionHeaded(html, 'What I did') ?? '';
		expect(html).not.toMatch(/\bTODO\b/);
		expect(section).toContain('<p>I worked on it.</p>');
		expect(section).toMatch(/<ul>\s*<li>Netcode<\/li>\s*<\/ul>/);
		expect(section).not.toContain('Write-up coming soon.');
	});

	it('shows a quiet placeholder while nothing of the write-up is filled in yet', async () => {
		const todoOnly = await render({ game: gameEntry() }, { default: '<p>TODO: describe what I built.</p>' });
		expect(todoOnly).not.toMatch(/\bTODO\b/);
		expect(sectionHeaded(todoOnly, 'What I did')).toContain('Write-up coming soon.');
		expect(sectionHeaded(await render({ game: gameEntry() }), 'What I did')).toContain('Write-up coming soon.');
	});

	it('shows placeholders in place of a TODO studio, role or blurb', async () => {
		const html = await render({ game: gameEntry({ studio: 'TODO: studio', role: 'TODO: role', blurb: 'TODO: blurb' }) });
		expect(html).not.toMatch(/\bTODO\b/);
		expect(html).toMatch(/<dd class="game-page__studio"[^>]*>To be confirmed<\/dd>/);
		expect(html).toMatch(/<dd class="game-page__role"[^>]*>To be confirmed<\/dd>/);
		expect(html).toMatch(/<p class="game-page__blurb"[^>]*>Write-up coming soon.<\/p>/);
	});

	it('lists the tech the game was built with, and leaves the section out without any', async () => {
		const html = await render({ game: gameEntry({ tech: ['Unity', 'C#', 'Photon'] }) });
		expect(sectionHeaded(html, 'Tech')).toMatch(/<li[^>]*>Unity<\/li>\s*<li[^>]*>C#<\/li>\s*<li[^>]*>Photon<\/li>/);
		expect(sectionHeaded(await render({ game: gameEntry() }), 'Tech')).toBeUndefined();
	});

	it('links to each store page', async () => {
		const html = await render({
			game: gameEntry({ storeLinks: [{ label: 'Nintendo eShop', url: 'https://www.nintendo.com/good-job' }] }),
		});
		expect(html).toMatch(/<a[^>]*href="https:\/\/www.nintendo.com\/good-job"[^>]*>Nintendo eShop<\/a>/);
		expect(await render({ game: gameEntry() })).not.toContain('game-page__stores');
	});

	it('shows the screenshots in a gallery, each with its alt text, and leaves it out without any', async () => {
		const html = await render({
			game: gameEntry({
				screenshots: [
					{ image: fixtureImage, alt: 'The office, mid-chaos.' },
					{ image: fixtureImage, alt: 'A printer on fire.' },
				],
			}),
		});
		const gallery = sectionHeaded(html, 'Screenshots') ?? '';
		expect([...gallery.matchAll(/<img[^>]*\salt="([^"]*)"/g)].map((m) => m[1])).toEqual(['The office, mid-chaos.', 'A printer on fire.']);
		expect(sectionHeaded(await render({ game: gameEntry() }), 'Screenshots')).toBeUndefined();
	});

	it('serves screenshots in sizes to fit a gallery column, at most half the 56rem page', async () => {
		const img = imgTag(await render({ game: gameEntry({ screenshots: [{ image: largeImage, alt: 'The office.' }] }) }));
		expect(srcsetWidths(img)).toEqual([480, 960]);
		expect(sizesOf(img)).toBe('(min-width: 61rem) 28rem, (min-width: 45rem) 50vw, 100vw');
	});
});
