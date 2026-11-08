/**
 * Theme logic of the minimal prototype's light/dark toggle. The page follows `prefers-color-scheme`
 * until the visitor picks a theme; the pick is remembered in `localStorage`. Every storage access is
 * guarded, since storage can be missing or throw (private mode, blocked site data).
 */

export type Theme = 'light' | 'dark';

/** The `localStorage` key holding the visitor's pick. */
export const THEME_STORAGE_KEY = 'proto-minimal-theme';

/** The part of `Storage` the toggle uses. */
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

/** The theme the visitor picked earlier, or `null` when there is none (or storage is unavailable). */
export function readStoredTheme(storage: ThemeStorage | undefined): Theme | null {
	try {
		const value = storage?.getItem(THEME_STORAGE_KEY);
		return isTheme(value) ? value : null;
	} catch {
		return null;
	}
}

function storeTheme(storage: ThemeStorage | undefined, theme: Theme): void {
	try {
		storage?.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Storage is unavailable; the pick then lasts for this page view only.
	}
}

/** What the controller needs from the page. */
export interface ThemeControllerOptions {
	/** Where the pick is remembered: `localStorage`, or `undefined` when accessing it threw. */
	storage: ThemeStorage | undefined;
	/** Whether `prefers-color-scheme: dark` matches. */
	prefersDark: boolean;
	/** Shows `theme` on the page (e.g. sets `data-theme` on `<html>`). */
	apply: (theme: Theme) => void;
}

/** The toggle's state: the theme in effect and whether the visitor picked it. */
export interface ThemeController {
	/** The theme in effect: the remembered pick, or the system preference. */
	readonly theme: Theme;
	/** Switches to the other theme, applies and remembers it, and returns it. */
	toggle(): Theme;
	/**
	 * Reports a change of `prefers-color-scheme`. Until the visitor picks a theme the page follows it
	 * (through CSS, so nothing is applied); after a pick it is ignored.
	 */
	systemChanged(prefersDark: boolean): void;
}

/**
 * Creates the toggle's state, starting from the remembered pick or else the system preference.
 * Storage errors never escape: a pick that can't be stored lasts for the page view.
 */
export function createThemeController({ storage, prefersDark, apply }: ThemeControllerOptions): ThemeController {
	const stored = readStoredTheme(storage);
	let picked = stored !== null;
	let theme: Theme = stored ?? (prefersDark ? 'dark' : 'light');
	return {
		get theme() {
			return theme;
		},
		toggle() {
			theme = theme === 'dark' ? 'light' : 'dark';
			picked = true;
			apply(theme);
			storeTheme(storage, theme);
			return theme;
		},
		systemChanged(systemPrefersDark) {
			if (!picked) theme = systemPrefersDark ? 'dark' : 'light';
		},
	};
}
