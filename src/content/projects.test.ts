import { describe, expect, it } from 'vitest';
import { projectKindFolders, projectKinds } from './schemas';
import { loadProjects, rawEntries } from './test-entries';

const projects = loadProjects();

const byRepo = (repo: string) => projects.find((p) => p.repo === repo);

describe('project files', () => {
	// `./projects/<folder>/<name>.md` with its frontmatter `kind`.
	const files = Object.entries(rawEntries())
		.filter(([path]) => path.startsWith('./projects/'))
		.map(([path, source]) => ({ path, kind: /^kind:\s*(\S+)/m.exec(source)?.[1] }));

	it('keeps each project in the folder for its kind', () => {
		const misplaced = files.filter(({ path, kind }) => {
			const folder = projectKinds.includes(kind as (typeof projectKinds)[number])
				? projectKindFolders[kind as (typeof projectKinds)[number]]
				: undefined;
			return !path.startsWith(`./projects/${folder}/`);
		});
		expect(misplaced).toEqual([]);
	});

	// Entry ids are the file name alone (`generateId` in `src/content.config.ts`), so names can't repeat across folders.
	it('gives every project a unique file name', () => {
		const names = files.map(({ path }) => path.replace(/^.*\//, ''));
		expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([]);
	});
});

describe('former featured projects and the tools', () => {
	it.each([
		['ZeepSDK', 'donderjoekel/ZeepSDK', 'zeepkist-mod'],
		['Zeepkist GTR', 'donderjoekel/Zeepkist.GTR', 'zeepkist-mod'],
		['Modkist', 'Thundernerd/ModkistMKII', 'tool'],
		['FMD2r', 'Thundernerd/FMD2r', 'tool'],
		['GEN', 'Thundernerd/GEN', 'tool'],
		['AliasLoginGenerator', 'Thundernerd/AliasLoginGenerator', 'tool'],
		['MemeVault', 'Thundernerd/MemeVaultProject', 'tool'],
		['Rule Wars', 'Thundernerd/rule-wars', 'tool'],
		['GameSwiper', 'Thundernerd/GameSwiper', 'tool'],
		['PlayTogether', 'Thundernerd/PlayTogether', 'tool'],
	])('has %s, linked to %s, as a %s', (title, repo, kind) => {
		expect(byRepo(repo)).toMatchObject({ title, kind });
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
	it('does not mention the retired Backend repo', () => {
		expect(gtr?.body).not.toContain('Zeepkist.GTR.Backend');
	});
});
