/** A `TODO` placeholder left in a content entry's source. */
export interface Todo {
	/** The entry's path, as the glob that read it reports it. */
	file: string;
	/** 1-based line number in the file. */
	line: number;
	/** The frontmatter key the line sets, `'frontmatter'` for any other frontmatter line (such as a
	 * YAML comment), or `'body'`. */
	field: string;
	/** The line itself, trimmed. */
	text: string;
}

/**
 * Finds every `TODO` placeholder in the raw source of content entries, keyed by file path
 * (the shape `import.meta.glob(..., { query: '?raw', import: 'default', eager: true })` returns).
 */
export function findTodos(sources: Record<string, string>): Todo[] {
	return Object.entries(sources).flatMap(([file, source]) => {
		const lines = source.split(/\r?\n/);
		// Index of the closing `---` fence, or 0 when the file has no frontmatter.
		const frontmatterEnd = lines[0] === '---' ? lines.indexOf('---', 1) : 0;
		return lines.flatMap((raw, index) => {
			if (!raw.includes('TODO')) return [];
			const field =
				index < frontmatterEnd ? (/^([\w-]+):/.exec(raw)?.[1] ?? 'frontmatter') : 'body';
			return [{ file, line: index + 1, field, text: raw.trim() }];
		});
	});
}
