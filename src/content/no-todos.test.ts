import { describe, expect, it } from 'vitest';
import { findTodos } from './todos';

// Launch guard: no content entry may still hold a TODO placeholder. Content is still being filled
// in, so it only runs when CHECK_TODOS is set (`CHECK_TODOS=1 npm test`); before launch, drop the
// `skipIf` so it runs on every `npm test` and in CI. See "Content TODOs" in README.md.
// Raw file text, not parsed frontmatter, so TODOs in YAML comments count too. The glob covers the
// games and projects collections (src/content.config.ts).
const entries = import.meta.glob<string>('./{games,projects}/**/*.{md,mdx}', {
	query: '?raw',
	import: 'default',
	eager: true,
});

describe('content entries', () => {
	it.skipIf(!process.env.CHECK_TODOS)('hold no TODO placeholders', () => {
		const todos = findTodos(entries).map(({ file, line, field, text }) => `${file}:${line} (${field}): ${text}`);
		expect(todos).toEqual([]);
	});
});

const clean = `---
title: FRU
studio: Through Games
blurb: A body-motion party game.
---

I built the gameplay systems.
`;

describe('findTodos', () => {
	it('finds nothing in an entry without TODOs', () => {
		expect(findTodos({ './games/fru.md': clean })).toEqual([]);
	});

	it('names the file, field and line of a TODO in a frontmatter value', () => {
		const entry = clean.replace('studio: Through Games', "studio: 'TODO: studio'");
		expect(findTodos({ './games/fru.md': clean, './games/good-job.md': entry })).toEqual([
			{ file: './games/good-job.md', line: 3, field: 'studio', text: "studio: 'TODO: studio'" },
		]);
	});

	it('reports a TODO in a frontmatter comment as being in the frontmatter', () => {
		const entry = clean.replace('blurb:', '# TODO(Christiaan): confirm this blurb.\nblurb:');
		expect(findTodos({ './projects/zworpshop.md': entry })).toEqual([
			{ file: './projects/zworpshop.md', line: 4, field: 'frontmatter', text: '# TODO(Christiaan): confirm this blurb.' },
		]);
	});

	it('reports a TODO in the body as being in the body', () => {
		const entry = `${clean}\nNote: TODO describe the multiplayer systems.\n<!-- TODO: add a screenshot. -->\n`;
		expect(findTodos({ './games/fru.md': entry })).toEqual([
			{ file: './games/fru.md', line: 9, field: 'body', text: 'Note: TODO describe the multiplayer systems.' },
			{ file: './games/fru.md', line: 10, field: 'body', text: '<!-- TODO: add a screenshot. -->' },
		]);
	});
});
