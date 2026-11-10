import { experimental_AstroContainer } from 'astro/container';
import type { CollectionEntry } from 'astro:content';
import { afterEach, vi } from 'vitest';
import type * as GithubStats from '../lib/github-stats';
import type * as HomeSections from './home/sections';

/**
 * Test helpers for component tests: fixtures shaped like parsed content entries, so the tests don't
 * depend on real content, and a stand-in for the build-time GitHub stats.
 */

export type AstroContainer = experimental_AstroContainer;

/**
 * Creates a container for rendering components to HTML, with the site's `/Portfolio/` base path
 * stubbed for the calling test. Call it from `beforeEach`.
 */
export async function createContainer(): Promise<AstroContainer> {
	vi.stubEnv('BASE_URL', '/Portfolio/');
	return experimental_AstroContainer.create();
}

afterEach(() => {
	vi.unstubAllEnvs();
	sectionsOverride.list = undefined;
});

/**
 * The list of home sections a test swaps in, read by a module mocked with `withSectionsOverride()`;
 * `undefined` (the default, restored after each test) keeps the real list.
 */
export const sectionsOverride: { list: readonly HomeSections.HomeSection[] | undefined } = { list: undefined };

/**
 * Builds a mocked `src/components/home/sections` module whose `homeSections` is
 * `sectionsOverride.list` when a test sets it. Like `withFetchedStats()`, load it inside the factory:
 *
 * ```ts
 * vi.mock('./sections', async (importOriginal) =>
 * 	(await import('../test-fixtures')).withSectionsOverride(await importOriginal()),
 * );
 * ```
 */
export function withSectionsOverride(actual: typeof HomeSections): typeof HomeSections {
	return {
		...actual,
		get homeSections() {
			return (sectionsOverride.list ?? actual.homeSections) as typeof actual.homeSections;
		},
	};
}

/** The visible text of an HTML fragment, tags removed and whitespace collapsed. */
export const textOf = (fragment: string) => fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** The ids of the `<section>`s in rendered HTML, in page order. */
export const sectionIds = (html: string) => [...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

export const fixtureImage = { src: '/fixtures/cover.png', width: 640, height: 360, format: 'png' } as const;

/** A 4K image, larger than any slot on the site, so every candidate width in a `srcset` applies. */
export const largeImage = { ...fixtureImage, width: 3840, height: 2160 } as const;

/** The first `<img>` in rendered HTML whose attributes match `attribute` (any `<img>` without one). */
export const imgTag = (html: string, attribute = '') => html.match(new RegExp(`<img[^>]*${attribute}[^>]*>`))?.[0] ?? '';

/** The candidate widths in an `<img>`'s `srcset`, such as `[480, 960]`. */
export const srcsetWidths = (img: string) => [...(img.match(/\ssrcset="([^"]*)"/)?.[1] ?? '').matchAll(/\s(\d+)w\b/g)].map((m) => Number(m[1]));

/** An `<img>`'s `sizes` attribute, or `undefined` without one. */
export const sizesOf = (img: string) => img.match(/\ssizes="([^"]*)"/)?.[1];

export function projectEntry(
	data: Partial<CollectionEntry<'projects'>['data']> = {},
	id = 'serializable-interface',
	body?: string,
): CollectionEntry<'projects'> {
	return {
		id,
		collection: 'projects',
		// The raw Markdown body; a project with a write-up here gets a page (`hasPage()`).
		...(body === undefined ? {} : { body }),
		data: {
			title: 'SerializableInterface',
			// A fictional owner, so stats fetched from GitHub for real repos never apply to fixtures.
			repo: 'fixture-owner/serializable-interface',
			kind: 'unity-plugin',
			tags: [],
			blurb: 'Serialize interface references in the Unity inspector.',
			archived: false,
			...data,
		},
	};
}

export function gameEntry(data: Partial<CollectionEntry<'games'>['data']> = {}, id = 'good-job'): CollectionEntry<'games'> {
	return {
		id,
		collection: 'games',
		data: {
			title: 'Good Job!',
			platforms: ['Nintendo Switch'],
			role: 'Programmer',
			studio: 'Paladin Studios',
			year: 2020,
			storeLinks: [],
			blurb: 'A puzzle game about being the boss’s kid.',
			tech: [],
			screenshots: [],
			softLaunchOnly: false,
			...data,
		},
	};
}

/**
 * Builds a mocked `src/lib/github-stats` module whose `repoStats()` reads the given `fetched` stats
 * instead of the file the prebuild fetcher writes. Return it from a `vi.mock` factory; since
 * `vi.mock` is hoisted above the imports, load this helper inside the factory:
 *
 * ```ts
 * vi.mock('../lib/github-stats', async (importOriginal) =>
 * 	(await import('./test-fixtures')).withFetchedStats(await importOriginal(), { 'fixture-owner/fetched': { stars: 50, language: null } }),
 * );
 * ```
 */
export function withFetchedStats(
	actual: typeof GithubStats,
	fetched: Record<string, GithubStats.RepoStats>,
): typeof GithubStats {
	return { ...actual, repoStats: (project) => actual.resolveRepoStats(project, fetched) };
}
