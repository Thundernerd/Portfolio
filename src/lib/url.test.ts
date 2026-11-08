import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withBase } from './url';

describe.each(['/Portfolio', '/Portfolio/'])('withBase with BASE_URL "%s"', (base) => {
	beforeEach(() => {
		vi.stubEnv('BASE_URL', base);
		// Guard: both bases expect the same output, so prove the stub actually took effect.
		expect(import.meta.env.BASE_URL).toBe(base);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('returns the base root with a trailing slash for the empty path', () => {
		expect(withBase('')).toBe('/Portfolio/');
	});

	it('joins a path without a leading slash', () => {
		expect(withBase('favicon.svg')).toBe('/Portfolio/favicon.svg');
	});

	it('joins a path with a leading slash', () => {
		expect(withBase('/favicon.svg')).toBe('/Portfolio/favicon.svg');
	});

	it('keeps the trailing slash of a nested path', () => {
		expect(withBase('games/fru/')).toBe('/Portfolio/games/fru/');
	});
});
