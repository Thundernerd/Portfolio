import type { CollectionEntry } from 'astro:content';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createComponent, render as renderTemplate } from 'astro/runtime/server/index.js';
import { type AstroContainer, createContainer, gameEntry } from './components/test-fixtures';
import GameRoute from './pages/games/[slug].astro';

// Astro's content layer is not populated under Vitest; every game renders an empty body.
vi.mock('astro:content', async (importOriginal) => ({
	...(await importOriginal<typeof import('astro:content')>()),
	render: async (_entry: CollectionEntry<'games'>) => ({ Content: createComponent(() => renderTemplate``), headings: [] }),
}));

describe('/games/[slug]', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	it('describes itself for link previews with its own title, blurb and URL', async () => {
		const game = gameEntry({ title: 'Good Job!', blurb: 'An office puzzle game.' }, 'good-job');
		const html = await container.renderToString(GameRoute, {
			props: { game },
			request: new Request('https://thundernerd.github.io/Portfolio/games/good-job/'),
		});
		expect(html).toContain('<link rel="canonical" href="https://thundernerd.github.io/Portfolio/games/good-job/"');
		expect(html).toContain('<meta property="og:title" content="Good Job! · Christiaan"');
		expect(html).toContain(`<meta property="og:description" content="Christiaan's work on Good Job!: An office puzzle game."`);
		expect(html).toContain('<meta property="og:url" content="https://thundernerd.github.io/Portfolio/games/good-job/"');
	});
});
