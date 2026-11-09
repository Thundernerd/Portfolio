import type { CollectionEntry } from 'astro:content';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createComponent, render as renderTemplate, unescapeHTML } from 'astro/runtime/server/index.js';
import { type AstroContainer, createContainer, fixtureImage, projectEntry } from './components/test-fixtures';
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

/** The visible text of an HTML fragment, tags removed and whitespace collapsed. */
const textOf = (fragment: string) => fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

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

	it('shows a quiet placeholder instead of a TODO blurb', async () => {
		const html = await renderPage(projectEntry({ kind: 'featured', blurb: 'TODO: describe it' }));
		expect(html).not.toMatch(/\bTODO\b/);
		expect(html).toMatch(/<p class="site-project__blurb"[^>]*>Write-up coming soon.<\/p>/);
	});

	it('links back to the featured projects on the home page', async () => {
		const html = await renderPage(projectEntry({ kind: 'featured' }));
		expect(html).toMatch(/<a class="site-project__back"[^>]*href="\/Portfolio\/#featured"[^>]*>All featured projects<\/a>/);
	});
});
