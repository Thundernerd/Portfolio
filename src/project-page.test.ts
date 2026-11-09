import type { CollectionEntry } from 'astro:content';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createComponent, render as renderTemplate, unescapeHTML } from 'astro/runtime/server/index.js';
import { type AstroContainer, createContainer, fixtureImage, imgTag, largeImage, projectEntry, sizesOf, srcsetWidths, textOf } from './components/test-fixtures';
import ProjectPage, { getStaticPaths } from './pages/projects/[slug].astro';

// Astro's content layer is not populated under Vitest; the tests set the collection the page reads.
// Each entry's rendered Markdown body is the HTML in `bodies`, keyed by entry id.
const content = vi.hoisted(() => ({ projects: [] as CollectionEntry<'projects'>[], bodies: {} as Record<string, string> }));
vi.mock('astro:content', async (importOriginal) => ({
	...(await importOriginal<typeof import('astro:content')>()),
	getCollection: async (_name: 'projects', filter?: (entry: CollectionEntry<'projects'>) => unknown) =>
		filter ? content.projects.filter(filter) : content.projects,
	render: async (entry: CollectionEntry<'projects'>) => ({
		Content: createComponent(() => renderTemplate`${unescapeHTML(content.bodies[entry.id] ?? '')}`),
		headings: [],
	}),
}));

// Stands in for the stats file the prebuild fetcher writes; only `fixture-owner/fetched` was fetched.
vi.mock('./lib/github-stats', async (importOriginal) => {
	const fetched = { 'fixture-owner/fetched': { stars: 1234, language: 'ShaderLab', archived: true } };
	return (await import('./components/test-fixtures')).withFetchedStats(await importOriginal(), fetched);
});

describe('/projects/[slug]', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		content.projects = [];
		content.bodies = {};
		container = await createContainer();
	});

	const renderPage = (project: CollectionEntry<'projects'>) => container.renderToString(ProjectPage, { props: { project } });

	it('has a page for each featured project, at its entry id, and none for the other kinds', async () => {
		content.projects = [
			projectEntry({ title: 'ZeepSDK', kind: 'featured' }, 'zeepsdk'),
			projectEntry({ title: 'RTM', kind: 'zeepkist-mod' }, 'zeepkist-rtm'),
			projectEntry({ title: 'ExtendedEvent', kind: 'unity-plugin' }, 'extended-event'),
			projectEntry({ title: 'Code generator', kind: 'tool' }, 'code-generator'),
			projectEntry({ title: 'FMD2r', kind: 'featured' }, 'fmd2r'),
		];
		const paths = await getStaticPaths();
		expect(paths.map((path) => path.params.slug)).toEqual(['zeepsdk', 'fmd2r']);
		expect(paths.map((path) => path.props.project.data.title)).toEqual(['ZeepSDK', 'FMD2r']);
	});

	it('renders the title, blurb and README body inside the site layout', async () => {
		const project = projectEntry({ title: 'ZeepSDK', kind: 'featured', blurb: 'A modding SDK for Zeepkist.' }, 'zeepsdk');
		content.bodies.zeepsdk = '<p>ZeepSDK is a <strong>software development kit</strong>.</p>';
		const html = await renderPage(project);
		expect(html).toMatch(/<html[^>]*class="site"/);
		expect(html).toMatch(/<title>ZeepSDK · Christiaan<\/title>/);
		expect(html).toMatch(/<meta name="description" content="A modding SDK for Zeepkist.">/);
		expect(html).toMatch(/<h1[^>]*>ZeepSDK<\/h1>/);
		expect(html).toContain('A modding SDK for Zeepkist.</p>');
		expect(html).toContain('<p>ZeepSDK is a <strong>software development kit</strong>.</p>');
		expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('software development kit'));
	});

	it('describes itself for link previews with its own title, blurb and URL', async () => {
		const project = projectEntry({ title: 'ZeepSDK', kind: 'featured', blurb: 'A modding SDK for Zeepkist.' }, 'zeepsdk');
		const html = await container.renderToString(ProjectPage, {
			props: { project },
			request: new Request('https://thundernerd.github.io/Portfolio/projects/zeepsdk/'),
		});
		expect(html).toContain('<link rel="canonical" href="https://thundernerd.github.io/Portfolio/projects/zeepsdk/"');
		expect(html).toContain('<meta property="og:title" content="ZeepSDK · Christiaan"');
		expect(html).toContain('<meta property="og:description" content="A modding SDK for Zeepkist."');
		expect(html).toContain('<meta property="og:url" content="https://thundernerd.github.io/Portfolio/projects/zeepsdk/"');
	});

	describe('link-preview image', () => {
		const renderDeployed = (project: CollectionEntry<'projects'>) =>
			container.renderToString(ProjectPage, {
				props: { project },
				request: new Request(`https://thundernerd.github.io/Portfolio/projects/${project.id}/`),
			});
		const meta = (html: string, key: string) => new RegExp(`<meta property="${key}" content="([^"]*)"`).exec(html)?.[1];

		// Under Vitest `getImage()` returns Astro's dev endpoint (`/_image/?href=...&w=...&f=...`) rather than
		// the built `/Portfolio/_astro/<name>.<hash>.<ext>` file, so these read the variant's format and
		// width from its query; `npm run build` emits the file itself.
		const variant = (html: string) => {
			const url = new URL((meta(html, 'og:image') ?? '').replaceAll('&amp;', '&'));
			return { format: url.searchParams.get('f'), width: url.searchParams.get('w') };
		};

		it("previews the project's image when it has one, as a PNG of its own size", async () => {
			// As the build emits it: an `astro:assets` image's `src` is already under the base path.
			const image = { ...fixtureImage, src: '/Portfolio/_astro/zeepsdk.Ab12Cd34.png' };
			const html = await renderDeployed(projectEntry({ title: 'ZeepSDK', kind: 'featured', image }, 'zeepsdk'));
			expect(meta(html, 'og:image')).toMatch(/^https:\/\/thundernerd\.github\.io\/Portfolio\//);
			expect(variant(html)).toEqual({ format: 'png', width: '640' });
			expect(meta(html, 'og:image:width')).toBe('640');
			expect(meta(html, 'og:image:height')).toBe('360');
			expect(meta(html, 'og:image:alt')).toBe('Screenshot of ZeepSDK');
		});

		it('previews an AVIF image as a JPEG of at most 1200px wide', async () => {
			const image = { src: '/Portfolio/_astro/cover.Ab12Cd34.avif', width: 2400, height: 1200, format: 'avif' } as const;
			const html = await renderDeployed(projectEntry({ title: 'ZeepSDK', kind: 'featured', image }, 'zeepsdk'));
			expect(variant(html)).toEqual({ format: 'jpg', width: '1200' });
			expect(meta(html, 'og:image:type')).toBe('image/jpeg');
			expect(meta(html, 'og:image:width')).toBe('1200');
			expect(meta(html, 'og:image:height')).toBe('600');
			expect(meta(html, 'og:image:alt')).toBe('Screenshot of ZeepSDK');
		});

		it('previews a WebP image as a JPEG', async () => {
			const image = { src: '/Portfolio/_astro/cover.Ab12Cd34.webp', width: 800, height: 600, format: 'webp' } as const;
			const html = await renderDeployed(projectEntry({ kind: 'featured', image }, 'zeepsdk'));
			expect(variant(html)).toEqual({ format: 'jpg', width: '800' });
			expect(meta(html, 'og:image:type')).toBe('image/jpeg');
		});

		it('keeps a JPEG image a JPEG', async () => {
			const image = { src: '/Portfolio/_astro/cover.Ab12Cd34.jpg', width: 1920, height: 1080, format: 'jpg' } as const;
			const html = await renderDeployed(projectEntry({ kind: 'featured', image }, 'zeepsdk'));
			expect(variant(html)).toEqual({ format: 'jpg', width: '1200' });
			expect(meta(html, 'og:image:type')).toBe('image/jpeg');
			expect(meta(html, 'og:image:height')).toBe('675');
		});

		it('previews a GIF image as a PNG', async () => {
			const image = { src: '/Portfolio/_astro/cover.Ab12Cd34.gif', width: 800, height: 600, format: 'gif' } as const;
			const html = await renderDeployed(projectEntry({ kind: 'featured', image }, 'zeepsdk'));
			expect(variant(html)).toEqual({ format: 'png', width: '800' });
			expect(meta(html, 'og:image:type')).toBe('image/png');
		});

		it('previews the site card when it has none', async () => {
			const html = await renderDeployed(projectEntry({ title: 'ZeepSDK', kind: 'featured' }, 'zeepsdk'));
			expect(meta(html, 'og:image')).toBe('https://thundernerd.github.io/Portfolio/og.png');
			expect(meta(html, 'og:image:type')).toBe('image/png');
		});
	});

	/** The text of each `<dt>`/`<dd>` pair in the page's facts list. */
	const factsOf = (html: string) =>
		Object.fromEntries([...html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)].map((m) => [textOf(m[1]), textOf(m[2])]));

	it('lists the tech and links to the GitHub repo with its star count', async () => {
		const html = await renderPage(
			projectEntry({ kind: 'featured', repo: 'fixture-owner/zeepsdk', tags: ['C#', 'Unity', 'BepInEx'], stars: 1 }, 'zeepsdk'),
		);
		expect(factsOf(html)).toEqual({ Language: 'C#', Tech: 'C# Unity BepInEx', Stars: '1 star', Source: 'fixture-owner/zeepsdk' });
		expect(html).toMatch(/<a[^>]*href="https:\/\/github.com\/fixture-owner\/zeepsdk"[^>]*>fixture-owner\/zeepsdk<\/a>/);
		expect(html).not.toContain('Archived');
	});

	it("prefers GitHub's fetched stats and marks an archived repo", async () => {
		const html = await renderPage(projectEntry({ kind: 'featured', repo: 'fixture-owner/fetched', tags: ['C#'], stars: 1 }, 'fetched'));
		expect(factsOf(html)).toMatchObject({ Language: 'ShaderLab', Stars: '1,234 stars' });
		expect(html).toMatch(/<p class="site-project__archived"[^>]*>Archived<\/p>/);
	});

	it('leaves out the facts a project does not have', async () => {
		const html = await renderPage(projectEntry({ kind: 'featured', tags: [], stars: undefined }));
		expect(Object.keys(factsOf(html))).toEqual(['Source']);
	});

	it("shows the project's image, described by its title, and no image when it has none", async () => {
		const html = await renderPage(projectEntry({ title: 'ZeepSDK', kind: 'featured', image: fixtureImage }, 'zeepsdk'));
		expect(html).toMatch(/<figure class="site-project__media"[^>]*>\s*<img[^>]*alt="Screenshot of ZeepSDK"/);
		const without = await renderPage(projectEntry({ kind: 'featured' }));
		expect(without).not.toContain('<img');
		expect(without).not.toContain('site-project__media');
	});

	it("serves the project's image in sizes to fit the page, loaded first since it sits at the top", async () => {
		const html = await renderPage(projectEntry({ kind: 'featured', image: largeImage }, 'zeepsdk'));
		const img = imgTag(html, 'class="site-project__image"');
		expect(srcsetWidths(img)).toEqual([736, 1472]);
		expect(sizesOf(img)).toBe('(min-width: 52rem) 46rem, 100vw');
		expect(img).toMatch(/\sloading="eager"/);
		expect(img).toMatch(/\sfetchpriority="high"/);
	});

	it('shows a quiet placeholder instead of a TODO blurb', async () => {
		const html = await renderPage(projectEntry({ kind: 'featured', blurb: 'TODO: describe it' }));
		expect(html).not.toMatch(/\bTODO\b/);
		expect(html).toMatch(/<p class="site-project__blurb"[^>]*>Write-up coming soon.<\/p>/);
	});

	it('links back to the featured projects on the home page', async () => {
		const html = await renderPage(projectEntry({ kind: 'featured' }));
		expect(html).toMatch(/<a class="site-project__back"[^>]*href="\/Portfolio\/#featured"[^>]*>All featured projects<\/a>/);
	});

	it('shows a project\'s architecture diagram after its description, and none for a project without one', async () => {
		content.bodies['zeepkist-gtr'] = '<p>A whole system.</p>';
		const html = await renderPage(projectEntry({ title: 'Zeepkist GTR', kind: 'featured' }, 'zeepkist-gtr'));
		expect(html).toMatch(
			/<section class="site-project__diagram"[^>]*aria-labelledby="architecture"[^>]*>\s*<h2 id="architecture"[^>]*>Architecture<\/h2>\s*<figure/,
		);
		expect(html).toContain('<title id="gtr-diagram-title">Zeepkist GTR architecture</title>');
		expect(html.indexOf('A whole system.')).toBeLessThan(html.indexOf('site-project__diagram'));
		const without = await renderPage(projectEntry({ title: 'ZeepSDK', kind: 'featured' }, 'zeepsdk'));
		expect(without).not.toContain('site-project__diagram');
		expect(without).not.toContain('<svg');
	});
});
