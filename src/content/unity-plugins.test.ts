import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { parse } from 'yaml';
import { projectSchema } from './schemas';

// getCollection() has no data store under Vitest, so read the entries' frontmatter directly.
const sources = import.meta.glob<string>('./projects/**/*.{md,mdx}', {
	query: '?raw',
	import: 'default',
	eager: true,
});
const context = { image: () => z.string() } as unknown as SchemaContext;

const projects = Object.entries(sources).map(([file, source]) => {
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
	return { file, data: parse(frontmatter) as Record<string, unknown> };
});

const unityPlugins = projects.filter(({ data }) => data.kind === 'unity-plugin');

describe('Unity plugins collection', () => {
	it.each([
		'Thundernerd/Unity3D-SerializableInterface',
		'Thundernerd/Unity3D-ExtendedEvent',
		'Thundernerd/Unity3D-NSubstitute',
		'Thundernerd/Unity3D-IconManager',
		'Thundernerd/Unity3D-AutoHook',
		'Thundernerd/Unity3D-ExecutionOrderAttribute',
		'Thundernerd/Unity3D-ExtendedEditor',
		'Thundernerd/Unity3D-ComponentAttribute',
		'Thundernerd/Unity3D-Humanizr',
	])('has an entry for %s', (repo) => {
		expect(unityPlugins.map(({ data }) => data.repo)).toContain(repo);
	});

	it('has entries that all match the projects schema', () => {
		for (const { file, data } of unityPlugins) {
			const result = projectSchema(context).safeParse(data);
			expect(result.success, `${file}: ${result.error?.message}`).toBe(true);
		}
	});
});
