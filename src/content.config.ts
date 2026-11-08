import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { gameSchema, projectSchema } from './content/schemas';

const games = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/games' }),
	schema: gameSchema,
});

const projects = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
	schema: projectSchema,
});

export const collections = { games, projects };
