import { describe, expect, it } from 'vitest';
import { projectEntry } from '../components/test-fixtures';
import { gamePath, projectPagePath } from './paths';

describe('gamePath', () => {
	it("is the game's entry id under games/, as its page is served", () => {
		expect(gamePath('good-job')).toBe('games/good-job/');
	});
});

describe('projectPagePath', () => {
	it("is a featured project's entry id under projects/, as its page is served", () => {
		expect(projectPagePath(projectEntry({ kind: 'featured' }, 'zeepsdk'))).toBe('projects/zeepsdk/');
	});

	it('is undefined for the kinds without a page', () => {
		const kinds = ['zeepkist-mod', 'unity-plugin', 'tool'] as const;
		expect(kinds.map((kind) => projectPagePath(projectEntry({ kind }, 'rtm')))).toEqual([undefined, undefined, undefined]);
	});
});
