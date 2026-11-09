import { beforeEach, describe, expect, it } from 'vitest';
import { type AstroContainer, createContainer, sectionIds } from './components/test-fixtures';
import Index from './pages/index.astro';

describe('pages', () => {
	it('serves the home page and a page per game, and no prototype routes', () => {
		// Astro serves every file under `src/pages/` (tests too), so this lists every route the site has.
		expect(Object.keys(import.meta.glob('./pages/**/*')).sort()).toEqual(['./pages/games/[slug].astro', './pages/index.astro']);
	});

	describe('/', () => {
		let container: AstroContainer;
		beforeEach(async () => {
			container = await createContainer();
		});

		it('renders the home sections inside the site layout', async () => {
			const html = await container.renderToString(Index);
			expect(html).toMatch(/<html[^>]*class="site"/);
			expect(html).toMatch(/<a class="site-brand"[^>]*href="\/Portfolio\/"/);
			expect(sectionIds(html)).toEqual(['games', 'featured', 'zeepkist-mods', 'unity-plugins', 'contact']);
		});
	});
});
