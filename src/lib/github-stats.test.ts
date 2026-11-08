import { describe, expect, it } from 'vitest';
import { resolveRepoStats } from './github-stats';

const project = {
	repo: 'Thundernerd/Unity3D-SerializableInterface',
	stars: 300,
};

describe('resolveRepoStats', () => {
	it('prefers the star count fetched from GitHub', () => {
		const fetched = { [project.repo]: { stars: 412 } };
		expect(resolveRepoStats(project, fetched)).toStrictEqual({ stars: 412 });
	});

	it('falls back to the frontmatter stars when the repo was not fetched', () => {
		expect(resolveRepoStats(project, {})).toStrictEqual({ stars: 300 });
	});

	it('has no star count when neither GitHub nor the frontmatter gives one', () => {
		const { stars, ...withoutStars } = project;
		expect(resolveRepoStats(withoutStars, {})).toStrictEqual({ stars: undefined });
	});
});
