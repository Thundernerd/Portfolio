/**
 * The DOM wiring of the playful prototype's Konami-code easter egg (`Playful.astro`): typing the code
 * turns on turbo mode.
 */
import { konamiTracker } from './konami';

/**
 * Listens for the Konami code on the announcer's document. On a match it adds `is-turbo` to `<body>`,
 * dispatches `pf:turbo` on the document (the hero kart listens for it) and shows the cheat toast in
 * `announcer` (the `[data-pf-announcer]` live region) for 4 s. Returns a function that stops listening.
 */
export function mountKonami(announcer: HTMLElement): () => void {
	const document = announcer.ownerDocument;
	const track = konamiTracker();
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	const onKeydown = (event: KeyboardEvent) => {
		if (!track(event.key)) return;
		document.body.classList.add('is-turbo');
		document.dispatchEvent(new CustomEvent('pf:turbo'));
		announcer.textContent = 'Cheat unlocked: turbo mode! Every star now counts double.';
		announcer.classList.add('is-visible');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => announcer.classList.remove('is-visible'), 4000);
	};
	document.addEventListener('keydown', onKeydown);
	return () => document.removeEventListener('keydown', onKeydown);
}
