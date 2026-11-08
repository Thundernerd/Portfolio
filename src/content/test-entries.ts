import { parse } from 'yaml';
import { gameSchema, projectSchema } from './schemas';
import { testSchemaContext } from './test-context';
import { closingFence, sourceLines } from './todos';

// Astro's content layer is not populated under Vitest, so tests read the entry files directly.
// This is the one place that mirrors the collections' glob loaders in src/content.config.ts.
const sources = import.meta.glob<string>('./{games,projects}/**/*.{md,mdx}', {
	query: '?raw',
	import: 'default',
	eager: true,
});

/** Every collection entry's raw source, keyed by its path relative to `src/content/` (`./games/fru.md`). */
export function rawEntries(): Record<string, string> {
	return { ...sources };
}

/** Splits an entry's source into its parsed YAML frontmatter and its Markdown body. */
function splitEntry(source: string): { frontmatter: unknown; body: string } {
	const lines = sourceLines(source);
	const end = closingFence(lines);
	// The options Astro's own frontmatter parser uses, so entries parse here as they do in the build.
	const frontmatter = parse(lines.slice(1, Math.max(end, 1)).join('\n'), {
		schema: 'core',
		merge: true,
		customTags: ['timestamp'],
	});
	return { frontmatter: frontmatter ?? {}, body: lines.slice(end + 1).join('\n') };
}

const collection = (name: 'games' | 'projects') =>
	Object.entries(sources)
		.filter(([path]) => path.startsWith(`./${name}/`))
		.map(([, source]) => splitEntry(source));

/** The `games` collection's entries, validated with the collection's schema. */
export function loadGames() {
	return collection('games').map(({ frontmatter }) => gameSchema(testSchemaContext).parse(frontmatter));
}

/** The `projects` collection's entries, validated with the collection's schema, each with its Markdown body. */
export function loadProjects() {
	return collection('projects').map(({ frontmatter, body }) => ({
		...projectSchema(testSchemaContext).parse(frontmatter),
		body,
	}));
}
