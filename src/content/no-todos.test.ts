import { describe, expect, it } from 'vitest';
import { rawEntries } from './test-entries';
import { findTodos, formatTodo } from './todos';

// Launch guard: opt-in until launch, see "Content TODOs" in README.md. Reads the raw files so TODOs
// in YAML comments count too.
// The home profile's contact links hold TODOs too (see `src/components/home/profile.ts`).
const profile = import.meta.glob<string>('../components/home/profile.ts', { query: '?raw', import: 'default', eager: true });
const sources = { ...rawEntries(), ...profile };

describe('content entries and the home profile', () => {
	it('include the home profile', () => {
		expect(Object.keys(sources)).toContain('../components/home/profile.ts');
	});

	it.skipIf(!process.env.CHECK_TODOS)('hold no TODO placeholders', () => {
		const todos = findTodos(sources).map(formatTodo);
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

describe('formatTodo', () => {
	it('names the file, line and key of a frontmatter TODO', () => {
		expect(
			formatTodo({ file: './games/fru.md', line: 5, section: 'frontmatter', key: 'studio', text: "studio: 'TODO: studio'" }),
		).toBe("./games/fru.md:5 (studio): studio: 'TODO: studio'");
	});

	it('names the section when the TODO has no key', () => {
		expect(formatTodo({ file: './games/fru.md', line: 15, section: 'body', text: 'TODO: describe it.' })).toBe(
			'./games/fru.md:15 (body): TODO: describe it.',
		);
	});
});
