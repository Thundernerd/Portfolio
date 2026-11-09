// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountKonami } from './turbo';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** Presses `keys` on the page, as the visitor's keyboard does. */
function press(keys: string[]): void {
	for (const key of keys) document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

/** Counts the `pf:turbo` events dispatched on the page while `act` runs. */
function countTurbos(act: () => void): number {
	let turbos = 0;
	const onTurbo = () => turbos++;
	document.addEventListener('pf:turbo', onTurbo);
	act();
	document.removeEventListener('pf:turbo', onTurbo);
	return turbos;
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
		expect(countTurbos(() => press(CODE))).toBe(1);
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
		const wrong = ['ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

		expect(countTurbos(() => press(wrong))).toBe(0);
		expect(document.body.classList.contains('is-turbo')).toBe(false);
		expect(announcer.textContent).toBe('');
		expect(announcer.classList.contains('is-visible')).toBe(false);
	});
});
