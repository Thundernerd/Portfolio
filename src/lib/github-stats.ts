/** Star count and primary language of a GitHub repo, as written by `scripts/fetch-github.mjs`. */
export interface RepoStats {
	stars: number;
	/** GitHub's primary language for the repo; `null` when GitHub reports none. */
	language: string | null;
}

/** The project frontmatter fields the GitHub stats can stand in for. */
export interface RepoProject {
	repo: string;
	stars?: number;
	tags?: string[];
}

/** What to show for a project: GitHub's values where fetched, its frontmatter otherwise. */
export interface ResolvedRepoStats {
	stars: number | undefined;
	language: string | undefined;
}

/**
 * Programming languages that can appear among a project's tags (the tags also name engines and
 * libraries). A project's language falls back to the first of its tags found here when GitHub's
 * isn't known.
 */
export const TAG_LANGUAGES: readonly string[] = [
	'C#',
	'C++',
	'Rust',
	'TypeScript',
	'JavaScript',
	'Python',
	'Lua',
	'Go',
	'Batchfile',
	'Shell',
];

/**
 * Resolves a project's star count and language from the `fetched` stats. The star count falls back
 * to its frontmatter `stars` when the fetcher couldn't reach GitHub for that repo; the language falls
 * back to the first of its tags in `TAG_LANGUAGES` when the repo wasn't fetched or GitHub reports
 * none.
 */
export function resolveRepoStats(project: RepoProject, fetched: Record<string, RepoStats>): ResolvedRepoStats {
	const stats = fetched[project.repo];
	return {
		stars: stats?.stars ?? project.stars,
		language: stats?.language ?? project.tags?.find((tag) => TAG_LANGUAGES.includes(tag)),
	};
}

// Written by the prebuild step and gitignored, so it is absent on a fresh checkout (`astro check`,
// `astro dev`); a glob that matches nothing leaves every project on its frontmatter values.
const generated = import.meta.glob<Record<string, RepoStats>>('../data/github-stats.json', {
	eager: true,
	import: 'default',
});
const fetchedStats: Record<string, RepoStats> = Object.values(generated)[0] ?? {};

/** A project's star count and language: as fetched at build time, or from its frontmatter. */
export function repoStats(project: RepoProject): ResolvedRepoStats {
	return resolveRepoStats(project, fetchedStats);
}
