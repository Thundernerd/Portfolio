import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { absoluteUrl, resolveHref, withBase } from './url';

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

describe('absoluteUrl', () => {
	beforeEach(() => vi.stubEnv('BASE_URL', '/Portfolio/'));
	afterEach(() => vi.unstubAllEnvs());

	it('builds a full URL on the deployed site, under the base path', () => {
		expect(absoluteUrl('')).toBe('https://thundernerd.github.io/Portfolio/');
		expect(absoluteUrl('og.png')).toBe('https://thundernerd.github.io/Portfolio/og.png');
		expect(absoluteUrl('/games/fru/')).toBe('https://thundernerd.github.io/Portfolio/games/fru/');
	});
});
