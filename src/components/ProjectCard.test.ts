import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectCard from './ProjectCard.astro';
import { type AstroContainer, createContainer, fixtureImage, projectEntry } from './test-fixtures';

// Stands in for the stats file the prebuild fetcher writes; only `fixture-owner/fetched` was fetched.
vi.mock('../lib/github-stats', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../lib/github-stats')>();
	const fetched = { 'fixture-owner/fetched': { stars: 4321 } };
	return { ...actual, repoStats: (project: Parameters<typeof actual.repoStats>[0]) => actual.resolveRepoStats(project, fetched) };
});

describe('ProjectCard', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = (props: Record<string, unknown>) => container.renderToString(ProjectCard, { props });

	it('renders the title, blurb and a link to the GitHub repo', async () => {
		const html = await render({ project: projectEntry() });
		expect(html).toMatch(/<article[^>]*>/);
		expect(html).toMatch(/<h3[^>]*>.*SerializableInterface.*<\/h3>/s);
		expect(html).toContain('Serialize interface references in the Unity inspector.');
		expect(html).toContain('href="https://github.com/fixture-owner/serializable-interface"');
	});

	it('links to the repo once, leaving the title unlinked, when given no href', async () => {
		const html = await render({ project: projectEntry() });
		expect(html.match(/href="https:\/\/github.com\/fixture-owner\/serializable-interface"/g)).toHaveLength(1);
		expect(html).toMatch(/<h3[^>]*>\s*SerializableInterface\s*<\/h3>/);
	});

	it('links the title to a base-prefixed page when given an href', async () => {
		const html = await render({ project: projectEntry(), href: 'projects/serializable-interface/' });
		expect(html).toMatch(/<h3[^>]*>\s*<a[^>]*href="\/Portfolio\/projects\/serializable-interface\/"/);
	});

	it('lists tags only when there are some', async () => {
		expect(await render({ project: projectEntry() })).not.toContain('project-card__tags');
		const html = await render({ project: projectEntry({ tags: ['Unity', 'C#'] }) });
		expect(html).toMatch(/<li[^>]*>Unity<\/li>\s*<li[^>]*>C#<\/li>/);
	});

	it('shows the star count only when known', async () => {
		expect(await render({ project: projectEntry() })).not.toContain('stars');
		const html = await render({ project: projectEntry({ stars: 1234 }) });
		expect(html).toMatch(/<data[^>]*value="1234"[^>]*>1,234<\/data>\s*<span[^>]*>stars<\/span>/);
	});

	it('prefers the star count fetched from GitHub over the frontmatter', async () => {
		const html = await render({ project: projectEntry({ repo: 'fixture-owner/fetched', stars: 2 }) });
		expect(html).toMatch(/<data[^>]*value="4321"[^>]*>4,321<\/data>/);
		expect(html).not.toMatch(/<data[^>]*value="2"/);
	});

	it('uses singular wording for one star', async () => {
		expect(await render({ project: projectEntry({ stars: 1 }) })).toMatch(/>1<\/data>\s*<span[^>]*>star<\/span>/);
	});

	it('renders the image only when present, as decoration beside the heading', async () => {
		expect(await render({ project: projectEntry() })).not.toContain('<img');
		const html = await render({ project: projectEntry({ image: fixtureImage }) });
		expect(html).toMatch(/<img[^>]*\salt(=""|[\s>])/);
	});

	it('renders slotted media in place of the image', async () => {
		const html = await container.renderToString(ProjectCard, {
			props: { project: projectEntry({ image: fixtureImage }) },
			slots: { media: '<video src="https://example.com/demo.mp4"></video>' },
		});
		expect(html).not.toContain('<img');
		expect(html).toMatch(/<article[^>]*>\s*<div class="project-card__media"[^>]*>\s*<video src="https:\/\/example.com\/demo.mp4"><\/video>/);
	});

	it('renders slotted extra content, such as more repo stats, right after the blurb', async () => {
		const html = await container.renderToString(ProjectCard, {
			props: { project: projectEntry({ tags: ['Unity'] }) },
			slots: { extra: '<p class="forks">12 forks</p>' },
		});
		expect(html).toMatch(/Unity inspector.<\/p>\s*<p class="forks">12 forks<\/p>\s*<ul class="project-card__tags"/);
	});

	it('labels a project archived only when its repo is archived', async () => {
		expect(await render({ project: projectEntry() })).not.toContain('Archived');
		const html = await render({ project: projectEntry({ archived: true }) });
		expect(html).toMatch(/<p[^>]*>Archived<\/p>/);
	});

	it('shows both the archived label and the fetched star count on an archived project', async () => {
		const html = await render({ project: projectEntry({ repo: 'fixture-owner/fetched', stars: 2, archived: true }) });
		expect(html).toMatch(/<p[^>]*>Archived<\/p>/);
		expect(html).toMatch(/<data[^>]*value="4321"[^>]*>4,321<\/data>/);
		expect(html).toContain('Serialize interface references in the Unity inspector.');
	});

	it('shows the archived label but no star badge when an archived project has no star count', async () => {
		const html = await render({ project: projectEntry({ archived: true }) });
		expect(html).toMatch(/<p[^>]*>Archived<\/p>/);
		expect(html).not.toContain('project-card__stars');
	});

	it('keeps the archived label and fetched star badge when both slots are filled', async () => {
		const html = await container.renderToString(ProjectCard, {
			props: { project: projectEntry({ repo: 'fixture-owner/fetched', stars: 2, archived: true, image: fixtureImage }) },
			slots: { media: '<video src="https://example.com/demo.mp4"></video>', extra: '<p class="forks">12 forks</p>' },
		});
		expect(html).not.toContain('<img');
		expect(html).toMatch(/<div class="project-card__media"[^>]*>\s*<video/);
		expect(html).toMatch(/<\/h3>\s*<p[^>]*>Archived<\/p>\s*<p class="project-card__blurb"[^>]*>Serialize interface references in the Unity inspector.<\/p>\s*<p class="forks">12 forks<\/p>/);
		expect(html).toMatch(/<data[^>]*value="4321"[^>]*>4,321<\/data>/);
	});
});
