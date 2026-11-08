import { afterEach, describe, expect, it, vi } from 'vitest';
import { withBase } from './url';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('withBase with BASE_URL "/Portfolio"', () => {
	it('returns the base root with a trailing slash for the empty path', () => {
		vi.stubEnv('BASE_URL', '/Portfolio');
		expect(withBase('')).toBe('/Portfolio/');
	});

	it('joins a path without a leading slash', () => {
		vi.stubEnv('BASE_URL', '/Portfolio');
		expect(withBase('favicon.svg')).toBe('/Portfolio/favicon.svg');
	});

	it('joins a path with a leading slash', () => {
		vi.stubEnv('BASE_URL', '/Portfolio');
		expect(withBase('/favicon.svg')).toBe('/Portfolio/favicon.svg');
	});

	it('keeps the trailing slash of a nested path', () => {
		vi.stubEnv('BASE_URL', '/Portfolio');
		expect(withBase('games/fru/')).toBe('/Portfolio/games/fru/');
	});
});

describe('withBase with BASE_URL "/Portfolio/"', () => {
	it('returns the base root without doubling the slash for the empty path', () => {
		vi.stubEnv('BASE_URL', '/Portfolio/');
		expect(withBase('')).toBe('/Portfolio/');
	});

	it('joins a path without a leading slash', () => {
		vi.stubEnv('BASE_URL', '/Portfolio/');
		expect(withBase('favicon.svg')).toBe('/Portfolio/favicon.svg');
	});

	it('joins a path with a leading slash', () => {
		vi.stubEnv('BASE_URL', '/Portfolio/');
		expect(withBase('/favicon.svg')).toBe('/Portfolio/favicon.svg');
	});

	it('keeps the trailing slash of a nested path', () => {
		vi.stubEnv('BASE_URL', '/Portfolio/');
		expect(withBase('games/fru/')).toBe('/Portfolio/games/fru/');
	});
});
