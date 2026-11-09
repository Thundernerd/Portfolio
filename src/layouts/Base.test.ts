import type { CollectionEntry } from 'astro:content';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AstroContainer, createContainer, projectEntry, sectionsOverride } from '../components/test-fixtures';
import Base from './Base.astro';

vi.mock('../components/home/sections', async (importOriginal) =>
	(await import('../components/test-fixtures')).withSectionsOverride(await importOriginal()),
);

// Astro's content layer is not populated under Vitest; the tests set the projects the layout reads.
const content = vi.hoisted(() => ({ projects: [] as CollectionEntry<'projects'>[] }));
vi.mock('astro:content', async (importOriginal) => ({
	...(await importOriginal<typeof import('astro:content')>()),
	getCollection: async () => content.projects,
}));

describe('Base layout', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		content.projects = [];
		container = await createContainer();
	});

	const render = () => container.renderToString(Base, { props: { title: 'Christiaan' }, slots: { default: '<p>content</p>' } });
	const headOf = (html: string) => /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';

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

	/** The hrefs of the header navigation's links. */
	const navLinks = (html: string) =>
		[...(/<nav[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '').matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

	it('links the Tools section after Unity plugins once a tool project exists', async () => {
		content.projects = [projectEntry({ title: 'Code generator', kind: 'tool' }, 'code-generator')];
		const html = await render();
		expect(navLinks(html)).toEqual([
			'/Portfolio/#games',
			'/Portfolio/#featured',
			'/Portfolio/#zeepkist-mods',
			'/Portfolio/#unity-plugins',
			'/Portfolio/#tools',
			'/Portfolio/#contact',
		]);
		expect(html).toMatch(/<a href="\/Portfolio\/#tools">tools<\/a>/);
	});

	it('leaves the Tools link out while no tool project exists', async () => {
		content.projects = [projectEntry({ title: 'RTM', kind: 'zeepkist-mod' }, 'rtm')];
		expect(navLinks(await render())).not.toContain('/Portfolio/#tools');
	});

	it('puts a section added to the home sections list in the navigation', async () => {
		const { homeSections } = await vi.importActual<typeof import('../components/home/sections')>('../components/home/sections');
		sectionsOverride.list = [...homeSections, { id: 'talks', navLabel: 'talks', title: 'Talks' }];
		const nav = /<nav[^>]*>([\s\S]*?)<\/nav>/.exec(await render())?.[1] ?? '';
		expect(nav).toMatch(/<a href="\/Portfolio\/#contact">contact<\/a><\/li>\s*<li><a href="\/Portfolio\/#talks">talks<\/a>/);
	});

	it('builds its site links and assets under the base path', async () => {
		const html = await render();
		expect(html).toMatch(/<a class="site-brand"[^>]*href="\/Portfolio\/"/);
		expect(html).toContain('href="/Portfolio/favicon.svg"');
		// Only links: under Vitest the container points script `src`s at source files, which the build bundles.
		expect(html).not.toMatch(/href="\/(?!Portfolio\/)/);
	});

	describe('head metadata for search engines and link previews', () => {
		// The deployed home page, with a description, as the build renders it.
		const renderHomeWithDescription = () =>
			container.renderToString(Base, {
				props: { title: 'Christiaan', description: 'Games and Unity plugins.' },
				request: new Request('https://thundernerd.github.io/Portfolio/'),
			});
		const head = async () => headOf(await renderHomeWithDescription());
		const meta = (html: string, key: string) =>
			new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1];

		it('names the page\'s canonical URL on the deployed site', async () => {
			expect(await head()).toContain('<link rel="canonical" href="https://thundernerd.github.io/Portfolio/"');
		});

		it('describes the page for Open Graph link previews', async () => {
			const html = await head();
			expect(meta(html, 'og:type')).toBe('website');
			expect(meta(html, 'og:title')).toBe('Christiaan');
			expect(meta(html, 'og:description')).toBe('Games and Unity plugins.');
			expect(meta(html, 'og:url')).toBe('https://thundernerd.github.io/Portfolio/');
			expect(meta(html, 'og:image')).toBe('https://thundernerd.github.io/Portfolio/og.png');
			expect(meta(html, 'og:image:width')).toBe('1200');
			expect(meta(html, 'og:image:height')).toBe('630');
			expect(meta(html, 'og:image:alt')).toBeTruthy();
		});

		it('ships the preview image it points at, at the size it declares', () => {
			// A PNG's width and height are the first two fields of its IHDR chunk, right after the signature.
			const png = readFileSync(new URL('../../public/og.png', import.meta.url));
			expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
			expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
		});

		it('points crawlers at the sitemap', async () => {
			expect(await head()).toContain('<link rel="sitemap" href="/Portfolio/sitemap-index.xml"');
		});

		it('asks for a large image card on X/Twitter', async () => {
			expect(meta(await head(), 'twitter:card')).toBe('summary_large_image');
		});

		it('leaves the description tags out when the page has none', async () => {
			const html = await render();
			expect(html).not.toMatch(/name="description"|og:description/);
		});
	});

	it('links the site\'s icons for browser tabs and home screens', async () => {
		const head = headOf(await render());
		expect(head).toMatch(/<link rel="icon" type="image\/svg\+xml" href="\/Portfolio\/favicon.svg"/);
		expect(head).toMatch(/<link rel="icon" href="\/Portfolio\/favicon.ico" sizes="32x32"/);
		expect(head).toMatch(/<link rel="apple-touch-icon" href="\/Portfolio\/apple-touch-icon.png"/);
	});

	it('ships the site\'s own icon, not Astro\'s', () => {
		const svg = readFileSync(new URL('../../public/favicon.svg', import.meta.url), 'utf8');
		// The scaffold's icon is the Astro logo, a single path starting at this point.
		expect(svg).not.toContain('M50.4 78.5');
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
		const head = headOf(html);
		expect(head).toContain('portfolio-theme');
		expect(head).toContain('document.documentElement.dataset.theme');
	});
});
