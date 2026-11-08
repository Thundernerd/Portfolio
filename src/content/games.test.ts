import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { gameSchema } from './schemas';

// Astro's content layer is not populated under Vitest, so read the entry files directly and
// validate their frontmatter with the same schema the collection uses.
const sources = import.meta.glob<string>('./games/*.{md,mdx}', { query: '?raw', import: 'default', eager: true });
const context = { image: () => z.string() } as unknown as SchemaContext;

const games = Object.values(sources).map((source) => {
	const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
	return gameSchema(context).parse(parse(frontmatter));
});

const byTitle = (title: string) => games.find((game) => game.title === title);

describe('games content', () => {
	it('lists the three released games', () => {
		expect(games.map((game) => game.title).sort()).toEqual(['FRU', 'Good Job!', 'Nailed It! Baking Bash']);
	});

	it.each([
		['FRU', ['Xbox One'], 'Co-founder & programmer'],
		['Good Job!', ['Nintendo Switch'], 'Programmer'],
		['Nailed It! Baking Bash', ['Mobile'], 'Programmer (multiplayer systems)'],
	])('records the platforms and role for %s', (title, platforms, role) => {
		expect(byTitle(title)).toMatchObject({ platforms, role });
	});
});
