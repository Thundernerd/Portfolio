import { describe, expect, it } from 'vitest';
import { gameSchema, projectSchema } from './schemas';
import { testSchemaContext as context } from './test-context';

const validGame = {
	title: 'FRU',
	platforms: ['Xbox One'],
	role: 'Co-founder & programmer',
	studio: 'Through Games',
	year: 2016,
	cover: './fru-cover.png',
	trailer: 'https://www.youtube.com/watch?v=abc123',
	storeLinks: [{ label: 'Microsoft Store', url: 'https://www.xbox.com/games/store/fru' }],
	blurb: 'A body-controlled puzzle platformer.',
};

describe('games schema', () => {
	it('accepts a complete game entry', () => {
		expect(gameSchema(context).parse(validGame)).toEqual(validGame);
	});

	it('accepts a game without media or links yet, defaulting to no store links', () => {
		const { cover, trailer, storeLinks, ...placeholder } = validGame;
		expect(gameSchema(context).parse(placeholder)).toEqual({ ...placeholder, storeLinks: [] });
	});

	it('accepts a game whose release year is not known yet', () => {
		const { year, ...withoutYear } = validGame;
		expect(gameSchema(context).parse(withoutYear)).toEqual(withoutYear);
	});

	it.each([
		['no platforms', { platforms: [] }],
		['a fractional year', { year: 2016.5 }],
		['a trailer that is not a URL', { trailer: 'youtube abc123' }],
		['a store link that is not a URL', { storeLinks: [{ label: 'Store', url: 'store page' }] }],
		['a non-http trailer URL', { trailer: 'javascript:alert(1)' }],
		['a non-http store link', { storeLinks: [{ label: 'Store', url: 'mailto:a@b.c' }] }],
	])('rejects a game with %s', (_, override) => {
		expect(gameSchema(context).safeParse({ ...validGame, ...override }).success).toBe(false);
	});
});

const validProject = {
	title: 'SerializableInterface',
	repo: 'Thundernerd/Unity3D-SerializableInterface',
	kind: 'unity-plugin',
	tags: ['Unity', 'C#'],
	image: './serializable-interface.png',
	blurb: 'Serialize interface references in the Unity inspector.',
	stars: 300,
};

describe('projects schema', () => {
	it('accepts a complete project entry', () => {
		expect(projectSchema(context).parse(validProject)).toEqual({ ...validProject, archived: false });
	});

	it('accepts a project without image, tags or stars, defaulting to no tags', () => {
		const { image, tags, stars, ...minimal } = validProject;
		expect(projectSchema(context).parse(minimal)).toEqual({ ...minimal, tags: [], archived: false });
	});

	it('treats a project as maintained unless it is marked archived', () => {
		expect(projectSchema(context).parse(validProject).archived).toBe(false);
		expect(projectSchema(context).parse({ ...validProject, archived: true }).archived).toBe(true);
	});

	it.each(['featured', 'zeepkist-mod', 'unity-plugin', 'tool'])('accepts kind %s', (kind) => {
		expect(projectSchema(context).parse({ ...validProject, kind }).kind).toBe(kind);
	});

	it.each([
		['a repo without an owner', { repo: 'ZeepSDK' }],
		['a repo given as a URL', { repo: 'https://github.com/donderjoekel/ZeepSDK' }],
		['a repo given as a relative path', { repo: '../..' }],
		['an unknown kind', { kind: 'game' }],
		['negative stars', { stars: -1 }],
		['fractional stars', { stars: 1.5 }],
	])('rejects a project with %s', (_, override) => {
		expect(projectSchema(context).safeParse({ ...validProject, ...override }).success).toBe(false);
	});
});
