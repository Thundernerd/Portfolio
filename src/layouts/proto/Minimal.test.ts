import { beforeEach, describe, expect, it } from 'vitest';
import { type AstroContainer, createContainer } from '../../components/test-fixtures';
import Minimal from './Minimal.astro';

describe('Minimal layout', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = () => container.renderToString(Minimal, { props: { title: 'Prototype B' }, slots: { default: '<p>content</p>' } });

	it('links the navigation to every home-page section', async () => {
		const html = await render();
		const nav = /<nav[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
		expect([...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1])).toEqual([
			'#games',
			'#featured',
			'#zeepkist-mods',
			'#unity-plugins',
			'#contact',
		]);
	});

	it('builds its site links and assets under the base path', async () => {
		const html = await render();
		expect(html).toMatch(/<a class="mn-brand"[^>]*href="\/Portfolio\/proto\/minimal\/"/);
		expect(html).toContain('href="/Portfolio/favicon.svg"');
		// Only links: under Vitest the container points script `src`s at source files, which the build bundles.
		expect(html).not.toMatch(/href="\/(?!Portfolio\/)/);
	});

	it('renders the theme toggle hidden and unpressed until its script takes over', async () => {
		const html = await render();
		expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*data-theme-toggle[^>]*hidden/);
	});

	it('applies a remembered theme in the head, before the page paints', async () => {
		const html = await render();
		const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
		expect(head).toContain('proto-minimal-theme');
		expect(head).toContain('document.documentElement.dataset.theme');
	});
});
