import { beforeEach, describe, expect, it } from 'vitest';
import ProjectCard from './ProjectCard.astro';
import { type AstroContainer, createContainer, fixtureImage, projectEntry } from './test-fixtures';

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
		expect(html).toContain('href="https://github.com/Thundernerd/Unity3D-SerializableInterface"');
	});

	it('links to the repo once, leaving the title unlinked, when given no href', async () => {
		const html = await render({ project: projectEntry() });
		expect(html.match(/href="https:\/\/github.com\/Thundernerd\/Unity3D-SerializableInterface"/g)).toHaveLength(1);
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

	it('uses singular wording for one star', async () => {
		expect(await render({ project: projectEntry({ stars: 1 }) })).toMatch(/>1<\/data>\s*<span[^>]*>star<\/span>/);
	});

	it('renders the image only when present, as decoration beside the heading', async () => {
		expect(await render({ project: projectEntry() })).not.toContain('<img');
		const html = await render({ project: projectEntry({ image: fixtureImage }) });
		expect(html).toMatch(/<img[^>]*\salt(=""|[\s>])/);
	});
});
