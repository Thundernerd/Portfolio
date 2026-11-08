import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionGrid from './CollectionGrid.astro';
import { type AstroContainer, createContainer, fixtureImage, gameEntry, projectEntry } from './test-fixtures';

// Stands in for the stats file the prebuild fetcher writes; only `fixture-owner/fetched` was fetched.
vi.mock('../lib/github-stats', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../lib/github-stats')>();
	const fetched = { 'fixture-owner/fetched': { stars: 50, description: null } };
	return { ...actual, repoStats: (project: Parameters<typeof actual.repoStats>[0]) => actual.resolveRepoStats(project, fetched) };
});

describe('CollectionGrid', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = (props: Record<string, unknown>) => container.renderToString(CollectionGrid, { props });
	const titlesIn = (html: string) => [...html.matchAll(/<h3[^>]*>(?:\s*<a[^>]*>)?([^<]+)/g)].map((m) => m[1].trim());

	it('renders a section with its id, labelled by its heading', async () => {
		const html = await render({ id: 'unity-plugins', title: 'Unity plugins', items: [] });
		expect(html).toMatch(/<section[^>]*id="unity-plugins"[^>]*aria-labelledby="unity-plugins-heading"/);
		expect(html).toMatch(/<h2[^>]*id="unity-plugins-heading"[^>]*>Unity plugins<\/h2>/);
	});

	it('renders each project as a project card in a list item', async () => {
		const html = await render({
			id: 'mods',
			title: 'Mods',
			items: [projectEntry({ title: 'RTM' }, 'rtm'), projectEntry({ title: 'WASD' }, 'wasd')],
		});
		expect(html.match(/<li[^>]*>\s*<article class="project-card"/g)).toHaveLength(2);
	});

	it('orders projects by stars, most first, then unknown counts by title', async () => {
		const html = await render({
			id: 'mods',
			title: 'Mods',
			items: [
				projectEntry({ title: 'Zworpshop' }, 'zworpshop'),
				projectEntry({ title: 'RTM', stars: 3 }, 'rtm'),
				projectEntry({ title: 'Tester' }, 'tester'),
				projectEntry({ title: 'WASD', stars: 12 }, 'wasd'),
			],
		});
		expect(titlesIn(html)).toEqual(['WASD', 'RTM', 'Tester', 'Zworpshop']);
	});

	it('orders projects by their fetched star counts when GitHub was reachable', async () => {
		const html = await render({
			id: 'mods',
			title: 'Mods',
			items: [
				projectEntry({ title: 'RTM', stars: 10 }, 'rtm'),
				projectEntry({ title: 'WASD', repo: 'fixture-owner/fetched', stars: 1 }, 'wasd'),
			],
		});
		expect(titlesIn(html)).toEqual(['WASD', 'RTM']);
	});

	it('puts undated games last, ordering them by title', async () => {
		const html = await render({
			id: 'games',
			title: 'Games',
			items: [
				gameEntry({ title: 'Nailed It! Baking Bash', year: undefined }, 'nailed-it'),
				gameEntry({ title: 'FRU', year: undefined }, 'fru'),
				gameEntry({ title: 'Good Job!', year: 2020 }, 'good-job'),
			],
		});
		expect(titlesIn(html)).toEqual(['Good Job!', 'FRU', 'Nailed It! Baking Bash']);
	});

	it('renders games as game cards, newest first', async () => {
		const html = await render({
			id: 'games',
			title: 'Games',
			items: [
				gameEntry({ title: 'FRU', year: 2016 }, 'fru'),
				gameEntry({ title: 'Good Job!', year: 2020 }, 'good-job'),
			],
		});
		expect(html.match(/<article class="game-card"/g)).toHaveLength(2);
		expect(titlesIn(html)).toEqual(['Good Job!', 'FRU']);
	});

	it('links each card to the page itemHref gives it', async () => {
		const html = await render({
			id: 'featured',
			title: 'Featured',
			items: [projectEntry({ title: 'ZeepSDK' }, 'zeepsdk')],
			itemHref: (entry: { id: string }) => `projects/${entry.id}/`,
		});
		expect(html).toMatch(/<h3[^>]*>\s*<a[^>]*href="\/Portfolio\/projects\/zeepsdk\/"[^>]*>ZeepSDK<\/a>/);
	});

	it('renders slotted intro copy under the heading', async () => {
		const html = await render({ id: 'mods', title: 'Mods', items: [] });
		expect(html).not.toContain('collection-grid__intro');
		const withIntro = await container.renderToString(CollectionGrid, {
			props: { id: 'mods', title: 'Mods', items: [] },
			slots: { default: '<p>Mods for Zeepkist.</p>' },
		});
		expect(withIntro).toMatch(/<\/h2>.*<p>Mods for Zeepkist.<\/p>/s);
	});

	it('passes the content itemExtra gives each entry to its card, after the blurb', async () => {
		const html = await render({
			id: 'mods',
			title: 'Mods',
			items: [projectEntry({ title: 'RTM', blurb: 'RTM blurb.' }, 'rtm'), projectEntry({ title: 'WASD', blurb: 'WASD blurb.' }, 'wasd')],
			itemExtra: (entry: { id: string }) => (entry.id === 'rtm' ? '<p class="forks">3 forks</p>' : undefined),
		});
		expect(html).toMatch(/RTM blurb.<\/p>\s*<p class="forks">3 forks<\/p>/);
		expect(html.match(/class="forks"/g)).toHaveLength(1);
	});

	it('puts the media itemMedia gives an entry in place of its cover, keeping the cover of the rest', async () => {
		const html = await render({
			id: 'games',
			title: 'Games',
			items: [
				gameEntry({ title: 'Good Job!', year: 2020, cover: fixtureImage }, 'good-job'),
				gameEntry({ title: 'FRU', year: 2016, cover: fixtureImage }, 'fru'),
			],
			itemMedia: (entry: { id: string }) => (entry.id === 'good-job' ? '<iframe src="https://www.youtube.com/embed/abc"></iframe>' : undefined),
		});
		const [goodJob, fru] = html.split('<article').slice(1);
		expect(goodJob).toMatch(/^[^>]*>\s*<iframe src="https:\/\/www.youtube.com\/embed\/abc"><\/iframe>/);
		expect(goodJob).not.toContain('<img');
		expect(fru).toContain('<img');
	});
});
