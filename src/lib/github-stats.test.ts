import { describe, expect, it } from 'vitest';
import { resolveRepoStats } from './github-stats';

const project = {
	repo: 'Thundernerd/Unity3D-SerializableInterface',
	blurb: 'Serialize interface references in the Unity inspector.',
	stars: 300,
};

describe('resolveRepoStats', () => {
	it('prefers the stars and description fetched from GitHub', () => {
		const fetched = { [project.repo]: { stars: 412, description: 'Interfaces in the inspector' } };
		expect(resolveRepoStats(project, fetched)).toEqual({ stars: 412, description: 'Interfaces in the inspector' });
	});

	it('falls back to the frontmatter stars and blurb when the repo was not fetched', () => {
		expect(resolveRepoStats(project, {})).toEqual({ stars: 300, description: project.blurb });
	});

	it('falls back to the blurb when the GitHub repo has no description', () => {
		const fetched = { [project.repo]: { stars: 5, description: null } };
		expect(resolveRepoStats(project, fetched)).toEqual({ stars: 5, description: project.blurb });
	});

	it('has no star count when neither GitHub nor the frontmatter gives one', () => {
		const { stars, ...withoutStars } = project;
		expect(resolveRepoStats(withoutStars, {})).toEqual({ stars: undefined, description: project.blurb });
	});
});
