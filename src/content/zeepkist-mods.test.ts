import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import type { SchemaContext } from 'astro:content';
import { projectSchema } from './schemas';

// Astro's image() helper resolves files at build time; outside Astro, stand in a plain path.
const context = { image: () => z.string() } as unknown as SchemaContext;

const sources = import.meta.glob<string>('./projects/*.{md,mdx}', {
	query: '?raw',
	import: 'default',
	eager: true,
});

/** Every project entry's frontmatter, parsed with the collection schema. */
function loadProjects() {
	return Object.entries(sources).map(([file, source]) => {
		const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
		if (frontmatter === undefined) throw new Error(`${file} has no frontmatter`);
		return { file, data: projectSchema(context).parse(parse(frontmatter)) };
	});
}

describe('Zeepkist mods collection', () => {
	it('lists the expected mods, each once', () => {
		const repos = loadProjects()
			.filter(({ data }) => data.kind === 'zeepkist-mod')
			.map(({ data }) => data.repo)
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
