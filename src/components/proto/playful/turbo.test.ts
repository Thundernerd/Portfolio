// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountKonami } from './turbo';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** Presses `keys` on the page, as the visitor's keyboard does. */
function press(keys: string[]): void {
	for (const key of keys) document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

let announcer: HTMLElement;
let unmount: () => void;

beforeEach(() => {
	vi.useFakeTimers();
	// The toast as `Playful.astro` renders it.
	document.body.className = 'pf';
	document.body.innerHTML = '<div class="pf-toast" role="status" aria-live="polite" data-pf-announcer></div>';
	announcer = document.querySelector<HTMLElement>('[data-pf-announcer]')!;
	unmount = mountKonami(announcer);
});

afterEach(() => {
	unmount();
	vi.useRealTimers();
});

describe('mountKonami', () => {
	it('turns on turbo mode on <body> when the full code is typed', () => {
		press(CODE);

		expect(document.body.classList.contains('is-turbo')).toBe(true);
	});

	it('tells the page turbo mode is on with a pf:turbo event', () => {
		let turbos = 0;
		const onTurbo = () => turbos++;
		document.addEventListener('pf:turbo', onTurbo);

		press(CODE);
		document.removeEventListener('pf:turbo', onTurbo);

		expect(turbos).toBe(1);
	});

	it('announces turbo mode in the toast', () => {
		press(CODE);

		expect(announcer.textContent).toBe('Cheat unlocked: turbo mode! Every star now counts double.');
		expect(announcer.classList.contains('is-visible')).toBe(true);
	});

	it('hides the toast after 4 seconds', () => {
		press(CODE);

		vi.advanceTimersByTime(3999);
		expect(announcer.classList.contains('is-visible')).toBe(true);

		vi.advanceTimersByTime(1);
		expect(announcer.classList.contains('is-visible')).toBe(false);
	});

	it('restarts the 4 seconds when the code is typed again while the toast shows', () => {
		press(CODE);
		vi.advanceTimersByTime(3000);

		press(CODE);
		vi.advanceTimersByTime(3999);
		expect(announcer.classList.contains('is-visible')).toBe(true);

		vi.advanceTimersByTime(1);
		expect(announcer.classList.contains('is-visible')).toBe(false);
	});

	it('does nothing for a wrong sequence', () => {
		let turbos = 0;
		const onTurbo = () => turbos++;
		document.addEventListener('pf:turbo', onTurbo);

		press(['ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']);
		document.removeEventListener('pf:turbo', onTurbo);

		expect(document.body.classList.contains('is-turbo')).toBe(false);
		expect(turbos).toBe(0);
		expect(announcer.textContent).toBe('');
		expect(announcer.classList.contains('is-visible')).toBe(false);
	});
});
