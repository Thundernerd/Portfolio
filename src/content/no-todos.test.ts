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
		const todos = findTodos(entries).map(({ file, line, section, key, text }) => `${file}:${line} (${key ?? section}): ${text}`);
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

	it('names the file, line and key of a TODO in a frontmatter value', () => {
		const entry = clean.replace('studio: Through Games', "studio: 'TODO: studio'");
		expect(findTodos({ './games/fru.md': clean, './games/good-job.md': entry })).toEqual([
			{ file: './games/good-job.md', line: 3, section: 'frontmatter', key: 'studio', text: "studio: 'TODO: studio'" },
		]);
	});

	it('reports a TODO in a frontmatter comment as being in the frontmatter', () => {
		const entry = clean.replace('blurb:', '# TODO(Christiaan): confirm this blurb.\nblurb:');
		expect(findTodos({ './projects/zworpshop.md': entry })).toEqual([
			{ file: './projects/zworpshop.md', line: 4, section: 'frontmatter', text: '# TODO(Christiaan): confirm this blurb.' },
		]);
	});

	it('attributes a TODO on a continuation line to the key it continues', () => {
		const entry = clean.replace('blurb: A body-motion party game.', 'blurb: >\n  TODO one-line description.\nplatforms:\n  - TODO platform');
		expect(findTodos({ './games/fru.md': entry })).toEqual([
			{ file: './games/fru.md', line: 5, section: 'frontmatter', key: 'blurb', text: 'TODO one-line description.' },
			{ file: './games/fru.md', line: 7, section: 'frontmatter', key: 'platforms', text: '- TODO platform' },
		]);
	});

	it('reports a TODO in the body as being in the body', () => {
		const entry = `${clean}\nNote: TODO describe the multiplayer systems.\n<!-- TODO: add a screenshot. -->\n`;
		expect(findTodos({ './games/fru.md': entry })).toEqual([
			{ file: './games/fru.md', line: 9, section: 'body', text: 'Note: TODO describe the multiplayer systems.' },
			{ file: './games/fru.md', line: 10, section: 'body', text: '<!-- TODO: add a screenshot. -->' },
		]);
	});

	it('recognises frontmatter fences with a byte-order mark or trailing whitespace', () => {
		const entry = `\uFEFF--- \nstudio: 'TODO: studio'\n---  \n\nTODO: describe it.\n`;
		expect(findTodos({ './games/fru.md': entry })).toEqual([
			{ file: './games/fru.md', line: 2, section: 'frontmatter', key: 'studio', text: "studio: 'TODO: studio'" },
			{ file: './games/fru.md', line: 5, section: 'body', text: 'TODO: describe it.' },
		]);
	});

	it('ignores words that merely contain TODO', () => {
		const entry = clean.replace('I built the gameplay systems.', 'Posted on MASTODON; see TODOS.md.');
		expect(findTodos({ './games/fru.md': entry })).toEqual([]);
	});
});
