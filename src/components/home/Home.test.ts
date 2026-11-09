import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AstroContainer, createContainer, fixtureImage, gameEntry, projectEntry } from '../test-fixtures';
import Home from './Home.astro';

// Stands in for the stats file the prebuild fetcher writes; only `fixture-owner/fetched` was fetched.
vi.mock('../../lib/github-stats', async (importOriginal) => {
	const fetched = { 'fixture-owner/fetched': { stars: 50, language: 'ShaderLab' } };
	return (await import('../test-fixtures')).withFetchedStats(await importOriginal(), fetched);
});

describe('Home', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = (props: Record<string, unknown>) => container.renderToString(Home, { props });
	/** The visible text of an HTML fragment, tags removed and whitespace collapsed. */
	const textOf = (fragment: string) => fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	const sectionIds = (html: string) => [...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

	it('renders the hero, then every section in the agreed order', async () => {
		const html = await render({ games: [], projects: [] });
		expect(html).toMatch(/<h1[^>]*>/);
		expect(html.indexOf('<h1')).toBeLessThan(html.search(/<section[^>]*id="games"/));
		expect(sectionIds(html)).toEqual(['games', 'featured', 'zeepkist-mods', 'unity-plugins', 'contact']);
	});

	/** The card titles inside the section with this id. */
	const titlesIn = (html: string, id: string) => {
		const section = new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`).exec(html)?.[0] ?? '';
		return [...section.matchAll(/<h3[^>]*>(?:\s*<a[^>]*>)?([^<]+)/g)].map((m) => m[1].trim());
	};

	it('lists the games and puts each project in the section of its kind', async () => {
		const html = await render({
			games: [gameEntry({ title: 'Good Job!' }), gameEntry({ title: 'FRU' }, 'fru')],
			projects: [
				projectEntry({ title: 'ZeepSDK', kind: 'featured' }, 'zeepsdk'),
				projectEntry({ title: 'RTM', kind: 'zeepkist-mod' }, 'rtm'),
				projectEntry({ title: 'ExtendedEvent', kind: 'unity-plugin' }, 'extended-event'),
			],
		});
		expect(titlesIn(html, 'games').sort()).toEqual(['FRU', 'Good Job!']);
		expect(titlesIn(html, 'featured')).toEqual(['ZeepSDK']);
		expect(titlesIn(html, 'zeepkist-mods')).toEqual(['RTM']);
		expect(titlesIn(html, 'unity-plugins')).toEqual(['ExtendedEvent']);
	});

	/** The text of each project card's inline stats line, in page order. */
	const statsLines = (html: string) =>
		[...html.matchAll(/<ul class="mn-stats"[^>]*>([\s\S]*?)<\/ul>/g)].map((m) => textOf(m[1]));

	it('shows the language and star count inline after each project blurb', async () => {
		const html = await render({
			games: [],
			projects: [
				projectEntry({ title: 'Serializable Interface', tags: ['Unity', 'C#'], stars: 1300 }, 'si'),
				projectEntry({ title: 'ModkistMKII', kind: 'featured', tags: ['Rust', 'Tauri'], stars: 1 }, 'modkist'),
			],
		});
		expect(html).toMatch(/Unity inspector.<\/p>\s*<ul class="mn-stats"/);
		expect(statsLines(html)).toEqual(['Rust 1 star', 'C# 1,300 stars']);
	});

	it("shows GitHub's language for a fetched repo instead of the one its tags name", async () => {
		const html = await render({
			games: [],
			projects: [projectEntry({ title: 'Fetched', repo: 'fixture-owner/fetched', tags: ['Unity', 'C#'] }, 'fetched')],
		});
		expect(statsLines(html)).toEqual(['ShaderLab 50 stars']);
	});

	it('leaves out what a project does not have: a language among its tags, or a star count', async () => {
		const html = await render({
			games: [],
			projects: [projectEntry({ title: 'Docs', tags: ['NuGet'] }, 'docs')],
		});
		expect(html).not.toContain('mn-stats');
		const withStars = await render({ games: [], projects: [projectEntry({ tags: ['NuGet'], stars: 0 })] });
		expect(statsLines(withStars)).toEqual(['0 stars']);
	});

	/** The monogram shown in place of each game's missing cover, in page order. */
	const monograms = (html: string) =>
		[...html.matchAll(/<div class="game-card__media"[^>]*>\s*<span class="mn-monogram"[^>]*aria-hidden="true"[^>]*>([^<]*)<\/span>/g)].map(
			(m) => m[1],
		);

	it('shows a monogram of the title in place of a missing game cover', async () => {
		const html = await render({
			games: [
				gameEntry({ title: 'FRU', year: 2016 }, 'fru'),
				gameEntry({ title: 'Good Job!', year: 2020 }, 'good-job'),
				gameEntry({ title: 'Nailed It! Baking Bash', year: 2019 }, 'nailed-it'),
			],
			projects: [],
		});
		expect(monograms(html)).toEqual(['GJ', 'NIB', 'FRU']);
	});

	it('keeps the cover of a game that has one', async () => {
		const html = await render({ games: [gameEntry({ cover: fixtureImage })], projects: [] });
		expect(html).toContain('<img');
		expect(html).not.toContain('mn-monogram');
	});

	it('shows a quiet placeholder instead of TODO text that is not filled in yet', async () => {
		const html = await render({
			games: [gameEntry({ studio: 'TODO: studio', blurb: 'TODO: one-line description of FRU.' }, 'fru')],
			projects: [projectEntry({ blurb: 'TODO: describe it' })],
		});
		expect(html).not.toMatch(/\bTODO\b/);
		expect(html).toMatch(/<dd class="game-card__studio"[^>]*>To be confirmed<\/dd>/);
		expect(html).toMatch(/<p class="game-card__blurb"[^>]*>Write-up coming soon.<\/p>/);
		expect(html).toMatch(/<p class="project-card__blurb"[^>]*>Write-up coming soon.<\/p>/);
	});

	it('sums up the games, open-source projects and their stars in the hero', async () => {
		const html = await render({
			games: [gameEntry(), gameEntry({ title: 'FRU' }, 'fru')],
			projects: [
				projectEntry({ stars: 1200 }, 'a'),
				projectEntry({ stars: 34 }, 'b'),
				projectEntry({ stars: undefined }, 'c'),
			],
		});
		const facts = /<ul class="mn-facts"[^>]*>([\s\S]*?)<\/ul>/.exec(html)?.[1] ?? '';
		const items = [...facts.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1]));
		expect(items).toEqual(['2 released games', '3 open-source projects', '1,234 GitHub stars']);
	});

	it('breaks the projects down by language beside the hero, most used first', async () => {
		const html = await render({
			games: [],
			projects: [
				projectEntry({ tags: ['Rust', 'Tauri'] }, 'a'),
				projectEntry({ tags: ['Unity', 'C#'] }, 'b'),
				projectEntry({ tags: ['C#', 'BepInEx'] }, 'c'),
				projectEntry({ tags: ['NuGet'] }, 'd'),
			],
		});
		const panel = /<div class="hero__media"[^>]*>([\s\S]*?)<\/div>/.exec(html)?.[1] ?? '';
		const rows = [...panel.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1]));
		expect(rows).toEqual(['C# 2', 'Rust 1']);
	});
});
