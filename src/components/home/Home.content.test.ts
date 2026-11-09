import type { CollectionEntry } from 'astro:content';
import { beforeEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { gameSchema, projectSchema } from '../../content/schemas';
import { testSchemaContext as context } from '../../content/test-context';
import { type AstroContainer, createContainer } from '../test-fixtures';
import Home from './Home.astro';

// Astro's content layer is not populated under Vitest, so build the entries from the real content
// files with the collections' schemas, as the content tests do. Images are left out: outside Astro
// they are plain paths that `<Image>` can't render.
const frontmatterOf = (source: string) => parse(/^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '');
const idOf = (path: string) => path.replace(/^.*\/|\.mdx?$/g, '');
const entriesIn = (sources: Record<string, string>) => Object.entries(sources).map(([path, source]) => ({ id: idOf(path), data: frontmatterOf(source) }));

const games: CollectionEntry<'games'>[] = entriesIn(
	import.meta.glob<string>('../../content/games/**/*.{md,mdx}', { query: '?raw', import: 'default', eager: true }),
).map(({ id, data }) => ({ id, collection: 'games', data: { ...gameSchema(context).parse(data), cover: undefined } }));

const projects: CollectionEntry<'projects'>[] = entriesIn(
	import.meta.glob<string>('../../content/projects/**/*.{md,mdx}', { query: '?raw', import: 'default', eager: true }),
).map(({ id, data }) => ({ id, collection: 'projects', data: { ...projectSchema(context).parse(data), image: undefined } }));

describe('Home with the real content', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	it('renders a card for every game and every project in a home-page section', async () => {
		const html = await container.renderToString(Home, { props: { games, projects } });
		const titles = [...html.matchAll(/<h3[^>]*>(?:\s*<a[^>]*>)?([^<]+)/g)].map((m) => m[1].trim().replaceAll('&amp;', '&'));
		const shown = projects.filter((p) => p.data.kind !== 'tool');
		expect(games.length).toBeGreaterThan(0);
		expect(shown.length).toBeGreaterThan(0);
		expect(titles.sort()).toEqual([...games, ...shown].map((entry) => entry.data.title).sort());
	});

	it('shows an avatar and GitHub, LinkedIn, email and CV entries in the contact section', async () => {
		const html = await container.renderToString(Home, { props: { games: [], projects: [] } });
		const contact = /<section[^>]*id="contact"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
		expect(contact).toMatch(/<img[^>]*class="contact__avatar"/);
		const entries = [...contact.matchAll(/class="contact__link[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1]);
		for (const contactKind of [/^GitHub\b/, /^LinkedIn\b/, /^Email\b/, /^CV\b/]) {
			expect(entries.some((entry) => contactKind.test(entry)), String(contactKind)).toBe(true);
		}
	});
});
