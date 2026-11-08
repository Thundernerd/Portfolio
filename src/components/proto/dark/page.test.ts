import type { CollectionEntry } from 'astro:content';
import { beforeEach, describe, expect, it } from 'vitest';
import { gameSchema, projectSchema } from '../../../content/schemas';
import { testSchemaContext as context } from '../../../content/test-context';
import { type AstroContainer, createContainer } from '../../test-fixtures';
import DarkHome from './DarkHome.astro';

// The real content, parsed from the same files the collections' glob loaders read.
type Files = Record<string, { frontmatter: Record<string, unknown> }>;
const idOf = (path: string) => path.replace(/^.*\/|\.mdx?$/g, '');
const games = Object.entries(import.meta.glob('../../../content/games/*.md', { eager: true }) as Files).map(
	([path, file]) => ({ id: idOf(path), collection: 'games', data: gameSchema(context).parse(file.frontmatter) }) as CollectionEntry<'games'>,
);
const projects = Object.entries(import.meta.glob('../../../content/projects/*.md', { eager: true }) as Files).map(
	([path, file]) =>
		({ id: idOf(path), collection: 'projects', data: projectSchema(context).parse(file.frontmatter) }) as CollectionEntry<'projects'>,
);

const decode = (html: string) => html.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

describe('/proto/dark home', () => {
	let container: AstroContainer;
	let html: string;
	beforeEach(async () => {
		container = await createContainer();
		html = await container.renderToString(DarkHome, { props: { games, projects } });
	});

	it('renders the hero and then the sections in the agreed order', () => {
		expect(html).toMatch(/<h1[^>]*>/);
		const headings = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => decode(m[1]).trim());
		expect(headings).toEqual(['Released games', 'Featured projects', 'Zeepkist mods', 'Unity plugins', 'About & contact']);
	});

	it.each([
		['games', games.map((g) => g.data.title)],
		['featured', projects.filter((p) => p.data.kind === 'featured').map((p) => p.data.title)],
		['zeepkist-mods', projects.filter((p) => p.data.kind === 'zeepkist-mod').map((p) => p.data.title)],
		['unity-plugins', projects.filter((p) => p.data.kind === 'unity-plugin').map((p) => p.data.title)],
	])('lists every %s entry in its section', (id, expected) => {
		const section = html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';
		const titles = [...section.matchAll(/<h3[^>]*>(?:\s*<a[^>]*>)?([^<]+)/g)].map((m) => decode(m[1]).trim());
		expect(expected.length).toBeGreaterThan(0);
		expect(titles.sort()).toEqual(expected.sort());
	});
});
