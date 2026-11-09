import { describe, expect, it } from 'vitest';
import { gamePath } from './paths';

describe('gamePath', () => {
	it("is the game's entry id under games/, as its page is served", () => {
		expect(gamePath('good-job')).toBe('games/good-job/');
	});
});
