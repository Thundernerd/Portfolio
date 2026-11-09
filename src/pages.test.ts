import { beforeEach, describe, expect, it } from 'vitest';
import { type AstroContainer, createContainer } from './components/test-fixtures';
import Index from './pages/index.astro';

describe('pages', () => {
	it('serves the home page and no prototype routes', () => {
		// Astro serves every file under `src/pages/` (tests too), so this lists every route the site has.
		expect(Object.keys(import.meta.glob('./pages/**/*'))).toEqual(['./pages/index.astro']);
	});

	describe('/', () => {
		let container: AstroContainer;
		beforeEach(async () => {
			container = await createContainer();
		});

		it('renders the home sections inside the site layout', async () => {
			const html = await container.renderToString(Index);
			expect(html).toMatch(/<html[^>]*class="mn"/);
			expect(html).toMatch(/<a class="mn-brand"[^>]*href="\/Portfolio\/"/);
			const sections = [...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
			expect(sections).toEqual(['games', 'featured', 'zeepkist-mods', 'unity-plugins', 'contact']);
		});
	});
});
