// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { mountThemeToggle } from './toggle';

/** A `Storage`-like stand-in backed by a map. */
function memoryStorage(initial: Record<string, string> = {}) {
	const map = new Map(Object.entries(initial));
	return {
		getItem: (key: string) => map.get(key) ?? null,
		setItem: (key: string, value: string) => void map.set(key, value),
	};
}

/** A `prefers-color-scheme: dark` media query stand-in whose system theme the test can change. */
function fakeSystem(prefersDark: boolean) {
	const listeners: ((event: { matches: boolean }) => void)[] = [];
	return {
		matches: prefersDark,
		addEventListener: (_type: 'change', listener: (event: { matches: boolean }) => void) => void listeners.push(listener),
		/** Switches the system theme and notifies the listeners, as the browser does. */
		change(dark: boolean) {
			this.matches = dark;
			for (const listener of listeners) listener({ matches: dark });
		},
	};
}

let button: HTMLButtonElement;

// The button as `ThemeToggle.astro` renders it (the Astro container can't render under happy-dom).
const TOGGLE_MARKUP = `
	<button class="mn-toggle" type="button" aria-pressed="false" data-theme-toggle hidden>
		<span class="mn-toggle__track" aria-hidden="true"><span class="mn-toggle__thumb"></span></span>
		<span class="mn-toggle__label">Dark mode</span>
	</button>`;

beforeEach(() => {
	document.body.innerHTML = TOGGLE_MARKUP;
	delete document.documentElement.dataset.theme;
	button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!;
});

const pressed = () => button.getAttribute('aria-pressed');

describe('mountThemeToggle', () => {
	it('shows the button once mounted', () => {
		expect(button.hidden).toBe(true);

		mountThemeToggle(button, { storage: memoryStorage(), system: fakeSystem(false) });

		expect(button.hidden).toBe(false);
	});

	it('starts pressed when the system prefers dark', () => {
		mountThemeToggle(button, { storage: memoryStorage(), system: fakeSystem(true) });

		expect(pressed()).toBe('true');
	});

	it('starts pressed when the visitor picked dark earlier, whatever the system prefers', () => {
		mountThemeToggle(button, { storage: memoryStorage({ 'proto-minimal-theme': 'dark' }), system: fakeSystem(false) });

		expect(pressed()).toBe('true');
	});

	it('starts unpressed when the visitor picked light earlier, whatever the system prefers', () => {
		mountThemeToggle(button, { storage: memoryStorage({ 'proto-minimal-theme': 'light' }), system: fakeSystem(true) });

		expect(pressed()).toBe('false');
	});

	it('switches <html> to the other theme on each click and presses the button for dark', () => {
		mountThemeToggle(button, { storage: memoryStorage(), system: fakeSystem(false) });

		button.click();
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(pressed()).toBe('true');

		button.click();
		expect(document.documentElement.dataset.theme).toBe('light');
		expect(pressed()).toBe('false');
	});

	it('follows a system theme change while the visitor has not picked a theme', () => {
		const system = fakeSystem(false);
		mountThemeToggle(button, { storage: memoryStorage(), system });

		system.change(true);
		expect(pressed()).toBe('true');

		system.change(false);
		expect(pressed()).toBe('false');
	});

	it('ignores a system theme change once the visitor has picked a theme', () => {
		const system = fakeSystem(false);
		mountThemeToggle(button, { storage: memoryStorage(), system });
		button.click();

		system.change(false);

		expect(pressed()).toBe('true');
		expect(document.documentElement.dataset.theme).toBe('dark');
	});
});
