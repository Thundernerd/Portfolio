import { describe, expect, it } from 'vitest';
import { resolveRepoStats } from './github-stats';

const project = {
	repo: 'Thundernerd/Unity3D-SerializableInterface',
	stars: 300,
	archived: false,
};

describe('resolveRepoStats', () => {
	it('prefers the star count fetched from GitHub', () => {
		const fetched = { [project.repo]: { stars: 412 } };
		expect(resolveRepoStats(project, fetched)).toStrictEqual({ stars: 412, archived: false });
	});

	it('falls back to the frontmatter stars when the repo was not fetched', () => {
		expect(resolveRepoStats(project, {})).toStrictEqual({ stars: 300, archived: false });
	});

	it('has no star count when neither GitHub nor the frontmatter gives one', () => {
		const { stars, ...withoutStars } = project;
		expect(resolveRepoStats(withoutStars, {})).toStrictEqual({ stars: undefined, archived: false });
	});

	it.each([
		['archived over a frontmatter that is not', true, false],
		['not archived over a frontmatter that is', false, true],
	])('prefers the fetched archived flag: %s', (_, fetchedArchived, frontmatterArchived) => {
		const fetched = { [project.repo]: { stars: 300, archived: fetchedArchived } };
		expect(resolveRepoStats({ ...project, archived: frontmatterArchived }, fetched).archived).toBe(fetchedArchived);
	});

	it.each([
		['the repo was not fetched', {}],
		['GitHub did not give the flag', { [project.repo]: { stars: 300 } }],
	])('falls back to the frontmatter archived flag when %s', (_, fetched) => {
		expect(resolveRepoStats({ ...project, archived: true }, fetched).archived).toBe(true);
	});
});
