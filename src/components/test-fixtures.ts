import type { CollectionEntry } from 'astro:content';

/** Test fixtures shaped like parsed content entries, so component tests don't depend on real content. */

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
			repo: 'Thundernerd/Unity3D-SerializableInterface',
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
