import { describe, expect, it } from 'vitest';
import { konamiTracker } from './konami';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const press = (keys: string[]) => {
	const track = konamiTracker();
	return keys.map((key) => track(key));
};

describe('konamiTracker', () => {
	it('reports a match on the last key of ↑↑↓↓←→←→BA, and only there', () => {
		expect(press(CODE)).toEqual([...Array(9).fill(false), true]);
	});

	it('accepts B and A typed with Shift or Caps Lock', () => {
		expect(press([...CODE.slice(0, 8), 'B', 'A']).at(-1)).toBe(true);
	});

	it('starts over after a wrong key', () => {
		expect(press(['ArrowUp', 'ArrowUp', 'ArrowDown', 'x', ...CODE.slice(3)]).includes(true)).toBe(false);
		expect(press(['ArrowUp', 'ArrowUp', 'ArrowDown', 'x', ...CODE]).at(-1)).toBe(true);
	});

	it('still matches when the code follows extra presses of its first key', () => {
		expect(press(['ArrowUp', 'ArrowUp', 'ArrowUp', ...CODE.slice(2)]).at(-1)).toBe(true);
	});

	it('matches again when the code is entered a second time', () => {
		expect(press([...CODE, ...CODE]).filter(Boolean)).toHaveLength(2);
	});
});
