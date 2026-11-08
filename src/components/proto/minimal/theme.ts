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

export interface ThemeControllerOptions {
	storage: ThemeStorage | undefined;
	/** Whether `prefers-color-scheme: dark` matches. */
	prefersDark: boolean;
	/** Shows `theme` on the page (e.g. sets `data-theme` on `<html>`). */
	apply: (theme: Theme) => void;
}

export interface ThemeController {
	/** The theme in effect: the remembered pick, or the system preference. */
	readonly theme: Theme;
	/** Switches to the other theme, applies and remembers it, and returns it. */
	toggle(): Theme;
}

export function createThemeController({ storage, prefersDark, apply }: ThemeControllerOptions): ThemeController {
	let theme: Theme = readStoredTheme(storage) ?? (prefersDark ? 'dark' : 'light');
	return {
		get theme() {
			return theme;
		},
		toggle() {
			theme = theme === 'dark' ? 'light' : 'dark';
			apply(theme);
			storeTheme(storage, theme);
			return theme;
		},
	};
}
