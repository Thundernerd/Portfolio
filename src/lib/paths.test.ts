import { describe, expect, it } from 'vitest';
import { projectEntry } from '../components/test-fixtures';
import { gamePath, projectPagePath } from './paths';

describe('gamePath', () => {
	it("is the game's entry id under games/, as its page is served", () => {
		expect(gamePath('good-job')).toBe('games/good-job/');
	});
});

describe('projectPagePath', () => {
	it("is a project's entry id under projects/ when it has a write-up, whatever its kind", () => {
		const kinds = ['zeepkist-mod', 'unity-plugin', 'tool'] as const;
		expect(kinds.map((kind) => projectPagePath(projectEntry({ kind }, 'zeepsdk', 'An SDK for mods.')))).toEqual([
			'projects/zeepsdk/',
			'projects/zeepsdk/',
			'projects/zeepsdk/',
		]);
	});

	it('is undefined for a project without a write-up, or with only notes in HTML comments', () => {
		expect(projectPagePath(projectEntry({}, 'rtm'))).toBeUndefined();
		expect(projectPagePath(projectEntry({}, 'rtm', '  \n'))).toBeUndefined();
		expect(projectPagePath(projectEntry({}, 'rtm', '<!-- TODO: write this up -->\n'))).toBeUndefined();
	});
});
