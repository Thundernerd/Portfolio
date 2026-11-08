/** A `TODO` placeholder left in a content entry's source. */
export interface Todo {
	/** The entry's path relative to `src/content/` (`./games/fru.md`), as `rawEntries()` keys it. */
	file: string;
	/** 1-based line number in the file. */
	line: number;
	/** Whether the TODO is in the YAML frontmatter or the Markdown body. */
	section: 'frontmatter' | 'body';
	/** The top-level frontmatter key whose value holds the TODO; absent for a YAML comment line
	 * and in the body. */
	key?: string;
	/** The line itself, trimmed. */
	text: string;
}

/** `TODO` as a whole word, so `TODO:` and `TODO(name)` count but `TODOS` and `MASTODON` don't. */
const hasTodo = (line: string) => /\bTODO\b/.test(line);

/** An entry's source split into lines, without a leading byte-order mark. */
export const sourceLines = (source: string) => source.replace(/^\uFEFF/, '').split(/\r?\n/);

const isFence = (line: string) => line.trimEnd() === '---';

/** Index of the line closing an entry's `---` frontmatter, or -1 when it has no (closed) frontmatter. */
export const closingFence = (lines: string[]) =>
	isFence(lines[0]) ? lines.findIndex((line, index) => index > 0 && isFence(line)) : -1;

/**
 * Finds every `TODO` placeholder in the raw source of content entries, keyed by file path
 * (the shape `rawEntries()` in `test-entries.ts` returns).
 */
export function findTodos(sources: Record<string, string>): Todo[] {
	return Object.entries(sources).flatMap(([file, source]) => {
		const lines = sourceLines(source);
		const frontmatterEnd = closingFence(lines);
		// The top-level key the current frontmatter line belongs to: indented lines (block scalars,
		// list items, nested maps) continue the key above them.
		let key: string | undefined;
		return lines.flatMap((raw, index): Todo[] => {
			if (index >= frontmatterEnd) {
				return hasTodo(raw) ? [{ file, line: index + 1, section: 'body', text: raw.trim() }] : [];
			}
			if (!/^\s/.test(raw)) key = /^([\w-]+):/.exec(raw)?.[1];
			if (!hasTodo(raw)) return [];
			return [{ file, line: index + 1, section: 'frontmatter', ...(key && { key }), text: raw.trim() }];
		});
	});
}

/** One line per TODO for the guard's failure report: `file:line (key or section): text`. */
export function formatTodo({ file, line, section, key, text }: Todo): string {
	return `${file}:${line} (${key ?? section}): ${text}`;
}
