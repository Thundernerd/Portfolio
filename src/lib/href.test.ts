import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveHref } from './href';

describe('resolveHref', () => {
	beforeEach(() => vi.stubEnv('BASE_URL', '/Portfolio/'));
	afterEach(() => vi.unstubAllEnvs());

	it('prefixes a site path with the base path', () => {
		expect(resolveHref('cv.pdf')).toBe('/Portfolio/cv.pdf');
		expect(resolveHref('/games/fru/')).toBe('/Portfolio/games/fru/');
	});

	it('leaves absolute URLs untouched', () => {
		expect(resolveHref('https://github.com/Thundernerd')).toBe('https://github.com/Thundernerd');
		expect(resolveHref('mailto:me@example.com')).toBe('mailto:me@example.com');
		expect(resolveHref('//cdn.example.com/x.js')).toBe('//cdn.example.com/x.js');
	});

	it('leaves in-page fragments untouched', () => {
		expect(resolveHref('#contact')).toBe('#contact');
	});
});
