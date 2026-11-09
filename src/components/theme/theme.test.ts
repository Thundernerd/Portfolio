import { describe, expect, it } from 'vitest';
import { memoryStorage } from './test-storage';
import { type Theme, createThemeController, readStoredTheme } from './theme';

/** Storage that throws on every access, as in Safari private mode or with site data blocked. */
const blockedStorage = {
	getItem: () => {
		throw new Error('SecurityError');
	},
	setItem: () => {
		throw new Error('SecurityError');
	},
};

describe('readStoredTheme', () => {
	it('returns the remembered choice', () => {
		expect(readStoredTheme(memoryStorage({ 'portfolio-theme': 'dark' }))).toBe('dark');
		expect(readStoredTheme(memoryStorage({ 'portfolio-theme': 'light' }))).toBe('light');
	});

	it('has no choice when nothing or something unknown is stored', () => {
		expect(readStoredTheme(memoryStorage())).toBeNull();
		expect(readStoredTheme(memoryStorage({ 'portfolio-theme': 'sepia' }))).toBeNull();
	});

	it('has no choice when storage is unavailable or throws', () => {
		expect(readStoredTheme(undefined)).toBeNull();
		expect(readStoredTheme(blockedStorage)).toBeNull();
	});
});

describe('createThemeController', () => {
	const setup = (storage: Parameters<typeof createThemeController>[0]['storage'], prefersDark: boolean) => {
		const applied: Theme[] = [];
		const controller = createThemeController({ storage, prefersDark, apply: (theme) => applied.push(theme) });
		return { controller, applied };
	};

	it('follows the system preference when the visitor has not picked a theme', () => {
		expect(setup(memoryStorage(), true).controller.theme).toBe('dark');
		expect(setup(memoryStorage(), false).controller.theme).toBe('light');
	});

	it('starts from the remembered pick over the system preference', () => {
		const storage = memoryStorage({ 'portfolio-theme': 'light' });
		expect(setup(storage, true).controller.theme).toBe('light');
	});

	it('flips the theme, applies it and remembers the pick', () => {
		const storage = memoryStorage();
		const { controller, applied } = setup(storage, true);
		expect(controller.toggle()).toBe('light');
		expect(controller.theme).toBe('light');
		expect(applied).toEqual(['light']);
		expect(storage.map.get('portfolio-theme')).toBe('light');
		expect(controller.toggle()).toBe('dark');
		expect(storage.map.get('portfolio-theme')).toBe('dark');
	});

	it('still toggles when storage throws, without remembering', () => {
		const { controller, applied } = setup(blockedStorage, false);
		expect(controller.toggle()).toBe('dark');
		expect(applied).toEqual(['dark']);
	});

	it('follows a change of the system preference until the visitor picks a theme', () => {
		const { controller, applied } = setup(memoryStorage(), false);
		controller.systemChanged(true);
		expect(controller.theme).toBe('dark');
		controller.toggle();
		controller.systemChanged(true);
		expect(controller.theme).toBe('light');
		expect(applied).toEqual(['light']);
	});

	it('ignores system changes when a pick was remembered from an earlier visit', () => {
		const { controller } = setup(memoryStorage({ 'portfolio-theme': 'light' }), false);
		controller.systemChanged(true);
		expect(controller.theme).toBe('light');
	});
});
