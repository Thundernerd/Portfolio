import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { gameSchema, projectSchema } from './content/schemas';

const games = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/games' }),
	schema: gameSchema,
});

// Projects live in one folder per kind (`featured/`, `mods/`, `plugins/`, `tools/`), but an entry's id
// is its file name alone, so its page URL (`/projects/<id>/`) doesn't depend on the folder.
const projects = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/content/projects',
		generateId: ({ entry }) => entry.replace(/^.*\//, '').replace(/\.mdx?$/, ''),
	}),
	schema: projectSchema,
});

export const collections = { games, projects };
