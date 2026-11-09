import { describe, expect, it } from 'vitest';
import { loadProjects } from './test-entries';

const projects = loadProjects();

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
	it.each(['Zeepkist.GTR', 'Zeepkist.GTR.Mod', 'Zeepkist.GTR.Database', 'Zeepkist.GTR.Graphql', 'Zeepkist.GTR.Discord'])(
		'links the public %s repo',
		(name) => {
			expect(gtr?.body).toContain(`(https://github.com/donderjoekel/${name})`);
		},
	);

	// The merged Backend service is retired; the page describes the split services instead.
	it('does not link the retired Backend repo', () => {
		expect(gtr?.body).not.toContain('Zeepkist.GTR.Backend');
	});
});
