/**
 * The DOM wiring of the site's light/dark toggle (`ThemeToggle.astro`): connects a
 * `createThemeController` to the toggle button, `<html>`'s `data-theme` and the system theme.
 */
import { createThemeController, type ThemeStorage } from './theme';

/** The part of the `prefers-color-scheme: dark` `MediaQueryList` the toggle uses. */
export interface SystemTheme {
	readonly matches: boolean;
	addEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void;
}

/** The browser APIs the toggle needs. */
export interface ThemeToggleOptions {
	/** Where the pick is remembered: `localStorage`, or `undefined` when accessing it threw. */
	storage: ThemeStorage | undefined;
	/** The `prefers-color-scheme: dark` media query. */
	system: SystemTheme;
}

/**
 * Wires the toggle `button` (pressed = dark): shows it, keeps `aria-pressed` on the theme in effect,
 * switches `data-theme` on `<html>` on click and follows system theme changes until the visitor picks one.
 */
export function mountThemeToggle(button: HTMLButtonElement, { storage, system }: ThemeToggleOptions): void {
	const root = button.ownerDocument.documentElement;
	const controller = createThemeController({
		storage,
		prefersDark: system.matches,
		apply: (theme) => {
			root.dataset.theme = theme;
		},
	});
	const show = () => button.setAttribute('aria-pressed', String(controller.theme === 'dark'));
	show();
	button.hidden = false;
	button.addEventListener('click', () => {
		controller.toggle();
		show();
	});
	system.addEventListener('change', (event) => {
		controller.systemChanged(event.matches);
		show();
	});
}
