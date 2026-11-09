import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = new URL('..', import.meta.url).pathname;
const globalCss = readFileSync(new URL('global.css', import.meta.url), 'utf8');

/** The site's stylesheet and every component's `<style>` block, by file. */
function stylesheets(): { file: string; css: string }[] {
	const astroFiles = (readdirSync(srcDir, { recursive: true }) as string[]).filter((file) => file.endsWith('.astro'));
	const blocks = astroFiles.flatMap((file) =>
		[...readFileSync(join(srcDir, file), 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({ file, css: m[1] })),
	);
	return [{ file: 'styles/global.css', css: globalCss }, ...blocks];
}

/** A CSS declaration and the preludes of the at-rules (`@media ...`) it is nested in. */
type Declaration = { property: string; value: string; atRules: string[] };

/** Each declaration in `css`. */
function declarations(css: string): Declaration[] {
	const found: Declaration[] = [];
	const stack: string[] = [];
	let text = '';
	for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
		if (char === '{') {
			stack.push(text.trim());
			text = '';
		} else if (char === '}' || char === ';') {
			const declaration = text.trim().match(/^([\w-]+)\s*:\s*([\s\S]+)$/);
			if (declaration) found.push({ property: declaration[1], value: declaration[2].trim(), atRules: stack.filter((prelude) => prelude.startsWith('@')) });
			text = '';
			if (char === '}') stack.pop();
		} else {
			text += char;
		}
	}
	return found;
}

describe('reduced motion', () => {
	it('only moves things for visitors who have not asked for reduced motion', () => {
		const moving = stylesheets().flatMap(({ file, css }) =>
			declarations(css)
				.filter(({ property, value }) => /^(transition|animation)/.test(property) || (property === 'scroll-behavior' && /\bsmooth\b/.test(value)))
				.filter(({ atRules }) => !atRules.some((prelude) => /prefers-reduced-motion:\s*no-preference/.test(prelude)))
				.map(({ property }) => `${file}: ${property}`),
		);
		expect(moving).toEqual([]);
	});
});

type Theme = 'light' | 'dark';

/** The light and dark values of each `light-dark()` colour token on `.site`, such as `--text`. */
function themeTokens(): Map<string, Record<Theme, string>> {
	const tokens = new Map<string, Record<Theme, string>>();
	for (const m of globalCss.matchAll(/(--[\w-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi)) {
		tokens.set(m[1], { light: m[2], dark: m[3] });
	}
	return tokens;
}

/** The WCAG 2 contrast ratio of two `#rrggbb` colours. */
function contrast(a: string, b: string): number {
	const luminance = (hex: string) => {
		const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (lighter + 0.05) / (darker + 0.05);
}

/** The token pairs whose contrast is below `minimum` in either theme, as `foreground on background (theme): ratio`. */
function failing(pairs: [string, string][], minimum: number): string[] {
	const tokens = themeTokens();
	return pairs.flatMap(([fg, bg]) =>
		(['light', 'dark'] as const).flatMap((theme) => {
			const [a, b] = [tokens.get(fg)?.[theme], tokens.get(bg)?.[theme]];
			if (!a || !b) return [`${fg} on ${bg}: missing token`];
			const ratio = contrast(a, b);
			return ratio < minimum ? [`${fg} on ${bg} (${theme}): ${ratio.toFixed(2)}`] : [];
		}),
	);
}

describe('colour contrast', () => {
	it('measures contrast as WCAG does', () => {
		expect(contrast('#000000', '#ffffff')).toBeCloseTo(21);
		expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
	});

	const textColours = ['--text', '--muted', '--accent', '--warn'];
	const surfaces = ['--bg', '--surface', '--chip', '--accent-soft', '--warn-soft'];

	it('keeps every text colour readable on every surface, in both themes (WCAG AA, 4.5:1)', () => {
		const pairs = textColours.flatMap((fg) => surfaces.map((bg): [string, string] => [fg, bg]));
		expect(failing(pairs, 4.5)).toEqual([]);
	});

	it('keeps selected text readable, in both themes (WCAG AA, 4.5:1)', () => {
		// `::selection` sets `--accent-ink` on `--accent`.
		expect(failing([['--accent-ink', '--accent']], 4.5)).toEqual([]);
	});

	it("keeps the focus ring and the theme toggle's state visible, in both themes (WCAG AA, 3:1)", () => {
		// The toggle's thumb shows its state: `--muted` on the `--chip` track when off, `--accent` on
		// `--accent-soft` when on. Its borders (`--rule`, `--rule-strong`) are fainter than 3:1, which
		// WCAG allows because its text label already marks out the control.
		const focusRing: [string, string][] = [['--accent', '--bg'], ['--accent', '--surface']];
		const toggleThumb: [string, string][] = [['--muted', '--chip'], ['--accent', '--accent-soft']];
		expect(failing([...focusRing, ...toggleThumb], 3)).toEqual([]);
	});
});
