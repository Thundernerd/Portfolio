import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { projectSchema } from './schemas';

// Astro's image() helper resolves files at build time; outside Astro, stand in a plain path.
const context = { image: () => z.string() } as unknown as SchemaContext;

const files = import.meta.glob<{ frontmatter: Record<string, unknown>; rawContent: () => string }>('./projects/*.{md,mdx}', {
	eager: true,
});

const projects = Object.entries(files).map(([path, mod]) => ({
	id: path.replace(/^\.\/projects\/|\.mdx?$/g, ''),
	body: mod.rawContent(),
	...projectSchema(context).parse(mod.frontmatter),
}));

describe('featured projects', () => {
	it.each([
		['modkist-mkii', 'Thundernerd/ModkistMKII'],
		['fmd2r', 'Thundernerd/FMD2r'],
		['zeepsdk', 'donderjoekel/ZeepSDK'],
		['zeepkist-gtr', 'donderjoekel/Zeepkist.GTR'],
	])('has %s, linked to %s', (id, repo) => {
		const project = projects.find((p) => p.id === id);
		expect(project).toMatchObject({ kind: 'featured', repo });
	});
});

describe('Zeepkist GTR', () => {
	const gtr = projects.find((p) => p.id === 'zeepkist-gtr');

	// The system spans several repos; only the public ones are linked.
	it.each(['Zeepkist.GTR.Mod', 'Zeepkist.GTR.Backend', 'Zeepkist.GTR.Database', 'Zeepkist.GTR.Graphql', 'Zeepkist.GTR.Discord'])(
		'links the public %s repo',
		(name) => {
			expect(gtr?.body).toContain(`(https://github.com/donderjoekel/${name})`);
		},
	);
});
