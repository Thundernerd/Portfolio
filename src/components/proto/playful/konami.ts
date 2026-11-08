/** ↑ ↑ ↓ ↓ ← → ← → B A, as `KeyboardEvent.key` values (letters lower-cased). */
const CODE = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

const LABELS: Record<string, string> = { arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→' };

/** The code as keycap labels, for showing it on the page. */
export const KONAMI_LABELS = CODE.map((key) => LABELS[key] ?? key.toUpperCase());

/**
 * Returns a function to feed every `KeyboardEvent.key` to; it returns `true` on the key that
 * completes the Konami code. It watches the last ten keys, so stray keys before the code don't matter.
 */
export function konamiTracker(): (key: string) => boolean {
	let recent: string[] = [];
	return (key) => {
		recent = [...recent, key.toLowerCase()].slice(-CODE.length);
		if (recent.length < CODE.length || recent.some((k, i) => k !== CODE[i])) return false;
		recent = [];
		return true;
	};
}
