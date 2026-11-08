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

const ofKind = (kind: string) => projects.filter((project) => project.data.kind === kind);
const decode = (html: string) => html.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

describe('/proto/dark home', () => {
	let container: AstroContainer;
	let html: string;
	const sectionOf = (id: string) => html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';

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
		['featured', ofKind('featured').map((p) => p.data.title)],
		['zeepkist-mods', ofKind('zeepkist-mod').map((p) => p.data.title)],
		['unity-plugins', ofKind('unity-plugin').map((p) => p.data.title)],
	])('lists every %s entry in its section', (id, expected) => {
		const section = sectionOf(id);
		const titles = [...section.matchAll(/<h3[^>]*>(?:\s*<a[^>]*>)?([^<]+)/g)].map((m) => decode(m[1]).trim());
		expect(expected.length).toBeGreaterThan(0);
		expect(titles.sort()).toEqual(expected.sort());
	});

	const cardsIn = (section: string) => section.split(/<article/).slice(1);

	it.each(['games', 'featured'])('gives every %s card large media, never a missing image', (id) => {
		const cards = cardsIn(sectionOf(id));
		expect(cards.length).toBeGreaterThan(0);
		for (const card of cards) expect(card).toMatch(/__media"[^>]*>\s*<(div class="dark-tile"|button[^>]*class="dark-trailer")/);
	});

	it.each(['zeepkist-mods', 'unity-plugins'])('keeps the %s cards compact, without media', (id) => {
		expect(sectionOf(id)).not.toContain('__media');
	});

	it('leaves unconfirmed TODO facts out instead of showing the placeholders', () => {
		expect(games.some((game) => /TODO/.test(game.data.blurb + game.data.studio))).toBe(true);
		expect(html).not.toMatch(/TODO/);
	});

	it('sums up the collections in the hero', () => {
		const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0] ?? '';
		const stat = (label: string) => hero.match(new RegExp(`<dt[^>]*>${label}</dt>\\s*<dd[^>]*>(\\d+)</dd>`))?.[1];
		expect(stat('Released games')).toBe(String(games.length));
		expect(stat('Zeepkist mods')).toBe(String(ofKind('zeepkist-mod').length));
		expect(stat('Unity plugins')).toBe(String(ofKind('unity-plugin').length));
	});
});
