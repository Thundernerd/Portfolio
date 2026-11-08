import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionGrid from './CollectionGrid.astro';
import { gameEntry, projectEntry } from './test-fixtures';

describe('CollectionGrid', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		vi.stubEnv('BASE_URL', '/Portfolio/');
		container = await AstroContainer.create();
	});
	afterEach(() => vi.unstubAllEnvs());

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

	it('renders slotted intro copy under the heading', async () => {
		const html = await render({ id: 'mods', title: 'Mods', items: [] }, );
		expect(html).not.toContain('collection-grid__intro');
		const withIntro = await container.renderToString(CollectionGrid, {
			props: { id: 'mods', title: 'Mods', items: [] },
			slots: { default: '<p>Mods for Zeepkist.</p>' },
		});
		expect(withIntro).toMatch(/<\/h2>.*<p>Mods for Zeepkist.<\/p>/s);
	});
});
