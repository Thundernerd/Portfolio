import { describe, expect, it } from 'vitest';
import { resolveRepoStats } from './github-stats';

const project = {
	repo: 'Thundernerd/Unity3D-SerializableInterface',
	stars: 300,
	tags: ['Unity', 'C#'],
	archived: false,
};

describe('resolveRepoStats', () => {
	it('prefers the star count fetched from GitHub', () => {
		const fetched = { [project.repo]: { stars: 412, language: 'C#' } };
		expect(resolveRepoStats(project, fetched)).toStrictEqual({ stars: 412, language: 'C#', archived: false });
	});

	it('falls back to the frontmatter stars when the repo was not fetched', () => {
		expect(resolveRepoStats(project, {})).toStrictEqual({ stars: 300, language: 'C#', archived: false });
	});

	it('has no star count when neither GitHub nor the frontmatter gives one', () => {
		const { stars, ...withoutStars } = project;
		expect(resolveRepoStats(withoutStars, {})).toStrictEqual({ stars: undefined, language: 'C#', archived: false });
	});

	it('prefers the language GitHub reports over the tags', () => {
		const fetched = { [project.repo]: { stars: 412, language: 'ShaderLab' } };
		expect(resolveRepoStats(project, fetched).language).toBe('ShaderLab');
	});

	it.each([
		['archived over a frontmatter that is not', true, false],
		['not archived over a frontmatter that is', false, true],
	])('prefers the fetched archived flag: %s', (_, fetchedArchived, frontmatterArchived) => {
		const fetched = { [project.repo]: { stars: 300, language: 'C#', archived: fetchedArchived } };
		expect(resolveRepoStats({ ...project, archived: frontmatterArchived }, fetched).archived).toBe(fetchedArchived);
	});

	it.each([
		['the repo was not fetched', {}],
		['GitHub reports no language', { [project.repo]: { stars: 412, language: null } }],
	])('falls back to the first language among the tags when %s', (_, fetched) => {
		const tagged = { ...project, tags: ['Unity', 'BepInEx', 'C#', 'Rust'] };
		expect(resolveRepoStats(tagged, fetched).language).toBe('C#');
	});

	it('has no language when neither GitHub nor the tags name one', () => {
		const fetched = { [project.repo]: { stars: 412, language: null } };
		expect(resolveRepoStats({ ...project, tags: ['Unity', 'NuGet'] }, fetched).language).toBeUndefined();
		const { tags, ...untagged } = project;
		expect(resolveRepoStats(untagged, {}).language).toBeUndefined();
	});

	it.each([
		['the repo was not fetched', {}],
		['GitHub did not give the flag', { [project.repo]: { stars: 300, language: 'C#' } }],
	])('falls back to the frontmatter archived flag when %s', (_, fetched) => {
		expect(resolveRepoStats({ ...project, archived: true }, fetched).archived).toBe(true);
	});
});
