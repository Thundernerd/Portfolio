import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { projectSchema } from './schemas';

// Astro's image() helper resolves files at build time; outside Astro, stand in a plain path.
const context = { image: () => z.string() } as unknown as SchemaContext;

// Same files as the `projects` collection's glob loader in src/content.config.ts.
const files = import.meta.glob<{ frontmatter: Record<string, unknown> }>('./projects/**/*.{md,mdx}', {
	eager: true,
});

const projects = Object.values(files).map((mod) => projectSchema(context).parse(mod.frontmatter));

describe('Zeepkist mods collection', () => {
	it('lists the expected mods, each once', () => {
		const repos = projects
			.filter((project) => project.kind === 'zeepkist-mod')
			.map((project) => project.repo)
			.sort();
		expect(repos).toEqual(
			[
				'Thundernerd/Zeepkist.RTM',
				'Thundernerd/Zeepkist.MedalTimes',
				'Thundernerd/Zeepkist.FavoriteBlocks',
				'Thundernerd/Zeepkist.ObjectProperties',
				'Thundernerd/Zeepkist.LogicScripting',
				'Thundernerd/Zeepkist.Tester',
				'Thundernerd/Zeepkist.VertexSnapper',
				'donderjoekel/Zeepkist.LevelEditorTrails',
				'Thundernerd/Zeepkist-WASD',
				'donderjoekel/Zeepkist.WorkshopApi',
				'donderjoekel/Zeepkist.Templates',
				'Thundernerd/Zeepkist.GameLibs',
				'Thundernerd/Zeepkist-Utilities',
				'Thundernerd/Zeepkist-Events',
				'Thundernerd/Zeepkist-LevelEditorMovementSpeed',
			].sort(),
		);
	});
});
