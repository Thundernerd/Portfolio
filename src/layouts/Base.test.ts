import { beforeEach, describe, expect, it } from 'vitest';
import { type AstroContainer, createContainer } from '../components/test-fixtures';
import Base from './Base.astro';

describe('Base layout', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = () => container.renderToString(Base, { props: { title: 'Christiaan' }, slots: { default: '<p>content</p>' } });

	it('links the navigation to every section of the home page, from any page', async () => {
		const html = await render();
		const nav = /<nav[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
		expect([...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1])).toEqual([
			'/Portfolio/#games',
			'/Portfolio/#featured',
			'/Portfolio/#zeepkist-mods',
			'/Portfolio/#unity-plugins',
			'/Portfolio/#contact',
		]);
	});

	it('builds its site links and assets under the base path', async () => {
		const html = await render();
		expect(html).toMatch(/<a class="mn-brand"[^>]*href="\/Portfolio\/"/);
		expect(html).toContain('href="/Portfolio/favicon.svg"');
		// Only links: under Vitest the container points script `src`s at source files, which the build bundles.
		expect(html).not.toMatch(/href="\/(?!Portfolio\/)/);
	});

	it('presents itself as the site, not as a prototype', async () => {
		const html = await render();
		expect(html).not.toMatch(/prototype/i);
	});

	it('renders the theme toggle hidden and unpressed until its script takes over', async () => {
		const html = await render();
		expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*data-theme-toggle[^>]*hidden/);
	});

	it('applies a remembered theme in the head, before the page paints', async () => {
		const html = await render();
		const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
		expect(head).toContain('portfolio-theme');
		expect(head).toContain('document.documentElement.dataset.theme');
	});
});
