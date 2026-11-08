import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { projectSchema } from './schemas';

// Astro's image() helper resolves files at build time; outside Astro, stand in a plain path.
const context = { image: () => z.string() } as unknown as SchemaContext;

// Same files as the `projects` collection's glob loader in src/content.config.ts.
const files = import.meta.glob<{ frontmatter: Record<string, unknown>; rawContent: () => string }>(
	'./projects/**/*.{md,mdx}',
	{ eager: true },
);

const projects = Object.values(files).map((mod) => ({
	body: mod.rawContent(),
	...projectSchema(context).parse(mod.frontmatter),
}));

const byRepo = (repo: string) => projects.find((p) => p.repo === repo);

describe('featured projects', () => {
	it.each([
		['ModkistMKII', 'Thundernerd/ModkistMKII'],
		['FMD2r', 'Thundernerd/FMD2r'],
		['ZeepSDK', 'donderjoekel/ZeepSDK'],
		['Zeepkist GTR', 'donderjoekel/Zeepkist.GTR'],
	])('has %s, linked to %s', (title, repo) => {
		expect(byRepo(repo)).toMatchObject({ title, kind: 'featured' });
	});
});

describe('Zeepkist GTR', () => {
	const gtr = byRepo('donderjoekel/Zeepkist.GTR');

	// The system spans several repos; only the public ones are linked.
	it.each(['Zeepkist.GTR.Mod', 'Zeepkist.GTR.Backend', 'Zeepkist.GTR.Database', 'Zeepkist.GTR.Graphql', 'Zeepkist.GTR.Discord'])(
		'links the public %s repo',
		(name) => {
			expect(gtr?.body).toContain(`(https://github.com/donderjoekel/${name})`);
		},
	);
});
