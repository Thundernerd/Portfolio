import { existsSync } from 'node:fs';
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

	it('renders a card for every game and every project', async () => {
		const html = await container.renderToString(Home, { props: { games, projects } });
		const titles = [...html.matchAll(/<h3[^>]*>(?:\s*<a[^>]*>)?([^<]+)/g)].map((m) => m[1].trim().replaceAll('&amp;', '&'));
		expect(games.length).toBeGreaterThan(0);
		expect(projects.length).toBeGreaterThan(0);
		expect(titles.sort()).toEqual([...games, ...projects].map((entry) => entry.data.title).sort());
	});

	it('shows an avatar and links to GitHub and LinkedIn in the contact section, with no email', async () => {
		const html = await container.renderToString(Home, { props: { games: [], projects: [] } });
		const contact = /<section[^>]*id="contact"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
		expect(contact).toMatch(/<img[^>]*class="contact__avatar"/);
		const links = [...contact.matchAll(/<a class="contact__link"[^>]*href="([^"]+)"[^>]*>([^<]+)</g)].map((m) => ({ href: m[1], label: m[2] }));
		expect(links).toContainEqual({ href: 'https://github.com/Thundernerd', label: 'GitHub · Thundernerd' });
		expect(links).toContainEqual({ href: 'https://www.linkedin.com/in/chrusb/', label: 'LinkedIn' });
		// No email address on the page, to keep it away from scrapers.
		const entries = [...contact.matchAll(/class="contact__link[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1]);
		expect(entries.filter((entry) => /^Email\b/.test(entry))).toEqual([]);
		expect(contact).not.toContain('mailto:');
	});

	it('links the CV as a download of a PDF under public/', async () => {
		const html = await container.renderToString(Home, { props: { games: [], projects: [] } });
		const contact = /<section[^>]*id="contact"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
		expect(contact).not.toContain('contact__link--pending');
		const cv = /<a class="contact__link" href="([^"]+)"([^>]*)>CV\b/.exec(contact);
		expect(cv?.[1]).toMatch(/^\/Portfolio\/[^/]+\.pdf$/);
		expect(cv?.[2]).toMatch(/\bdownload\b/);
		const file = new URL(`../../../public/${cv?.[1].replace(/^\/Portfolio\//, '')}`, import.meta.url);
		expect(existsSync(file), file.pathname).toBe(true);
	});
});
