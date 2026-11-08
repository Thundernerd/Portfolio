/** Stars and description of a GitHub repo, as written by `scripts/fetch-github.mjs`. */
export interface RepoStats {
	stars: number;
	description: string | null;
}

/** The project frontmatter fields the GitHub stats can stand in for. */
export interface RepoProject {
	repo: string;
	blurb: string;
	stars?: number;
}

/** What to show for a project: GitHub's values where fetched, its frontmatter otherwise. */
export interface ResolvedRepoStats {
	stars: number | undefined;
	description: string;
}

/**
 * Resolves a project's stars and description from the `fetched` stats, falling back to its frontmatter
 * `stars` and `blurb` when the fetcher couldn't reach GitHub for that repo.
 */
export function resolveRepoStats(project: RepoProject, fetched: Record<string, RepoStats>): ResolvedRepoStats {
	const stats = fetched[project.repo];
	return {
		stars: stats?.stars ?? project.stars,
		description: stats?.description ?? project.blurb,
	};
}

// Written by the prebuild step and gitignored, so it is absent on a fresh checkout (`astro check`,
// `astro dev`); a glob that matches nothing leaves every project on its frontmatter values.
const generated = import.meta.glob<Record<string, RepoStats>>('../data/github-stats.json', {
	eager: true,
	import: 'default',
});
const fetchedStats: Record<string, RepoStats> = Object.values(generated)[0] ?? {};

/** A project's stars and description: as fetched at build time, or from its frontmatter. */
export function repoStats(project: RepoProject): ResolvedRepoStats {
	return resolveRepoStats(project, fetchedStats);
}
