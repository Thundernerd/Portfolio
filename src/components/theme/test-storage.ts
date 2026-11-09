/** Storage fakes shared by the theme toggle's tests. */

/** A `Storage`-like stand-in backed by a map. */
export function memoryStorage(initial: Record<string, string> = {}) {
	const map = new Map(Object.entries(initial));
	return {
		getItem: (key: string) => map.get(key) ?? null,
		setItem: (key: string, value: string) => void map.set(key, value),
		map,
	};
}
