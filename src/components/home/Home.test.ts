import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectKinds } from '../../content/schemas';
import {
	type AstroContainer,
	createContainer,
	fixtureImage,
	gameEntry,
	projectEntry,
	sectionIds,
	sectionsOverride,
	textOf,
} from '../test-fixtures';
import Home from './Home.astro';

vi.mock('./sections', async (importOriginal) => (await import('../test-fixtures')).withSectionsOverride(await importOriginal()));

// Stands in for the stats file the prebuild fetcher writes; only `fixture-owner/fetched` was fetched.
vi.mock('../../lib/github-stats', async (importOriginal) => {
	const fetched = { 'fixture-owner/fetched': { stars: 50, language: 'ShaderLab' } };
	return (await import('../test-fixtures')).withFetchedStats(await importOriginal(), fetched);
});

// A profile with one confirmed contact link and one whose target is still a TODO.
vi.mock('./profile', async () => {
	const { fixtureImage } = await import('../test-fixtures');
	return {
		profile: {
			avatar: fixtureImage,
			avatarAlt: 'Portrait of Christiaan',
			links: [
				{ label: 'GitHub', href: 'https://github.com/Thundernerd' },
				{ label: 'LinkedIn', href: 'TODO: LinkedIn profile URL' },
			],
		},
	};
});

describe('Home', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = (props: Record<string, unknown>) => container.renderToString(Home, { props });

	it('renders the hero, then every section in the agreed order', async () => {
		const html = await render({ games: [], projects: [] });
		expect(html).toMatch(/<h1[^>]*>/);
		expect(html.indexOf('<h1')).toBeLessThan(html.search(/<section[^>]*id="games"/));
		expect(sectionIds(html)).toEqual(['games', 'featured', 'zeepkist-mods', 'unity-plugins', 'contact']);
	});

	it('takes the order and headings of its sections from the home sections list', async () => {
		sectionsOverride.list = [
			{ id: 'contact', navLabel: 'contact', title: 'Say hi' },
			{ id: 'unity-plugins', navLabel: 'plugins', title: 'Unity plugins' },
			{ id: 'zeepkist-mods', navLabel: 'mods', title: 'Zeepkist mods' },
			{ id: 'featured', navLabel: 'projects', title: 'Featured projects' },
			{ id: 'games', navLabel: 'games', title: 'Games' },
		];
		const html = await render({ games: [], projects: [] });
		expect(sectionIds(html)).toEqual(['contact', 'unity-plugins', 'zeepkist-mods', 'featured', 'games']);
		const headings = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1].trim());
		expect(headings).toEqual(['Say hi', 'Unity plugins', 'Zeepkist mods', 'Featured projects', 'Games']);
	});

	it("links each game card to the game's page", async () => {
		const html = await render({ games: [gameEntry({ title: 'FRU' }, 'fru')], projects: [] });
		expect(html).toMatch(/<a class="game-card__title-link"[^>]*href="\/Portfolio\/games\/fru\/"[^>]*>FRU<\/a>/);
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

	it('adds a Tools section after Unity plugins when a tool project exists, with unlinked cards and their stats', async () => {
		const html = await render({
			games: [],
			projects: [projectEntry({ title: 'Code generator', kind: 'tool', tags: ['C#'], stars: 12 }, 'code-generator')],
		});
		expect(sectionIds(html)).toEqual(['games', 'featured', 'zeepkist-mods', 'unity-plugins', 'tools', 'contact']);
		expect(html).toMatch(/<section[^>]*id="tools"[^>]*>[\s\S]*?<h2[^>]*>\s*Tools\s*<\/h2>/);
		expect(titlesIn(html, 'tools')).toEqual(['Code generator']);
		const tools = /<section[^>]*id="tools"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
		expect(tools).not.toMatch(/<h3[^>]*>\s*<a/);
		expect(textOf(/<ul class="site-stats"[^>]*>([\s\S]*?)<\/ul>/.exec(tools)?.[1] ?? '')).toBe('C# 12 stars');
	});

	it('counts tool projects in the hero facts and language breakdown', async () => {
		const html = await render({
			games: [],
			projects: [
				projectEntry({ title: 'RTM', kind: 'zeepkist-mod', tags: ['C#'], stars: 3 }, 'rtm'),
				projectEntry({ title: 'Code generator', kind: 'tool', tags: ['Rust'], stars: 4 }, 'code-generator'),
			],
		});
		const facts = /<ul class="site-facts"[^>]*>([\s\S]*?)<\/ul>/.exec(html)?.[1] ?? '';
		expect([...facts.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1]))).toEqual([
			'0 released games',
			'2 open-source projects',
			'7 GitHub stars',
		]);
		expect([...html.matchAll(/<span class="site-langs__name"[^>]*>([^<]+)/g)].map((m) => m[1]).sort()).toEqual(['C#', 'Rust']);
	});

	it('shows a project of every kind the schema allows in some section', async () => {
		const projects = projectKinds.map((kind) => projectEntry({ title: `A ${kind} project`, kind }, kind));
		const html = await render({ games: [], projects });
		const shown = sectionIds(html).flatMap((id) => titlesIn(html, id));
		expect(shown.sort()).toEqual(projects.map((project) => project.data.title).sort());
	});

	it('links each featured project card to its page, and no other project card', async () => {
		const html = await render({
			games: [],
			projects: [
				projectEntry({ title: 'ZeepSDK', kind: 'featured' }, 'zeepsdk'),
				projectEntry({ title: 'RTM', kind: 'zeepkist-mod' }, 'rtm'),
				projectEntry({ title: 'ExtendedEvent', kind: 'unity-plugin' }, 'extended-event'),
			],
		});
		const titleLinks = [...html.matchAll(/<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)/g)].map((m) => [m[2].trim(), m[1]]);
		expect(titleLinks).toEqual([['ZeepSDK', '/Portfolio/projects/zeepsdk/']]);
	});

	/** The text of each project card's inline stats line, in page order. */
	const statsLines = (html: string) =>
		[...html.matchAll(/<ul class="site-stats"[^>]*>([\s\S]*?)<\/ul>/g)].map((m) => textOf(m[1]));

	it('shows the language and star count inline after each project blurb', async () => {
		const html = await render({
			games: [],
			projects: [
				projectEntry({ title: 'Serializable Interface', tags: ['Unity', 'C#'], stars: 1300 }, 'si'),
				projectEntry({ title: 'ModkistMKII', kind: 'featured', tags: ['Rust', 'Tauri'], stars: 1 }, 'modkist'),
			],
		});
		expect(html).toMatch(/Unity inspector.<\/p>\s*<ul class="site-stats"/);
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
		expect(html).not.toContain('site-stats');
		const withStars = await render({ games: [], projects: [projectEntry({ tags: ['NuGet'], stars: 0 })] });
		expect(statsLines(withStars)).toEqual(['0 stars']);
	});

	/** The monogram shown in place of each game's missing cover, in page order. */
	const monograms = (html: string) =>
		[...html.matchAll(/<div class="game-card__media"[^>]*>\s*<span class="site-monogram"[^>]*aria-hidden="true"[^>]*>([^<]*)<\/span>/g)].map(
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
		expect(html).not.toContain('site-monogram');
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
		const facts = /<ul class="site-facts"[^>]*>([\s\S]*?)<\/ul>/.exec(html)?.[1] ?? '';
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

	it('shows the avatar and contact links of the profile in the contact section', async () => {
		const html = await render({ games: [], projects: [] });
		const contact = /<section[^>]*id="contact"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
		const avatar = /<img[^>]*>/.exec(contact)?.[0] ?? '';
		expect(avatar).toContain('class="contact__avatar"');
		expect(avatar).toContain('alt="Portrait of Christiaan"');
		expect(contact).toMatch(/<a[^>]*href="https:\/\/github.com\/Thundernerd"[^>]*>GitHub<\/a>/);
	});

	it('shows a contact link whose target is a TODO as a quiet placeholder', async () => {
		const html = await render({ games: [], projects: [] });
		expect(html).not.toMatch(/\bTODO\b/);
		expect(html).toMatch(/<span class="contact__link contact__link--pending"[^>]*>LinkedIn · to be confirmed<\/span>/);
	});
});
