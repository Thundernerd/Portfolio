import { experimental_AstroContainer } from 'astro/container';
import type { CollectionEntry } from 'astro:content';
import { afterEach, vi } from 'vitest';

/** Test helpers and fixtures shaped like parsed content entries, so component tests don't depend on real content. */

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
});

export const fixtureImage = { src: '/fixtures/cover.png', width: 640, height: 360, format: 'png' } as const;

export function projectEntry(
	data: Partial<CollectionEntry<'projects'>['data']> = {},
	id = 'serializable-interface',
): CollectionEntry<'projects'> {
	return {
		id,
		collection: 'projects',
		data: {
			title: 'SerializableInterface',
			// A fictional owner, so stats fetched from GitHub for real repos never apply to fixtures.
			repo: 'fixture-owner/serializable-interface',
			kind: 'unity-plugin',
			tags: [],
			blurb: 'Serialize interface references in the Unity inspector.',
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
			...data,
		},
	};
}
