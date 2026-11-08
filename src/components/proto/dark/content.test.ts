import { describe, expect, it } from 'vitest';
import { gameEntry, projectEntry } from '../../test-fixtures';
import { withoutTodos } from './content';

describe('withoutTodos', () => {
	it('empties text still marked TODO and keeps confirmed text', () => {
		const { data } = withoutTodos(gameEntry({ studio: 'TODO: studio', role: 'Programmer' }));
		expect(data.studio).toBe('');
		expect(data.role).toBe('Programmer');
	});

	it('drops TODO items from lists', () => {
		const { data } = withoutTodos(projectEntry({ tags: ['C#', 'TODO: more tags'] }));
		expect(data.tags).toEqual(['C#']);
	});
});
