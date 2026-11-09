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

	it('prefers the archived flag fetched from GitHub over the frontmatter', () => {
		expect(resolveRepoStats(project, { [project.repo]: { stars: 300, archived: true } }).archived).toBe(true);
		const markedArchived = { ...project, archived: true };
		expect(resolveRepoStats(markedArchived, { [project.repo]: { stars: 300, archived: false } }).archived).toBe(false);
	});

	it('falls back to the frontmatter archived flag when GitHub did not give one', () => {
		const markedArchived = { ...project, archived: true };
		expect(resolveRepoStats(markedArchived, {}).archived).toBe(true);
		expect(resolveRepoStats(markedArchived, { [project.repo]: { stars: 300 } }).archived).toBe(true);
	});
});
