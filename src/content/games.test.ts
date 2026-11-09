import { describe, expect, it } from 'vitest';
import { loadGames } from './test-entries';

const games = loadGames();

const byTitle = (title: string) => games.find((game) => game.title === title);

describe('games content', () => {
	it('lists the three released games', () => {
		expect(games.map((game) => game.title).sort()).toEqual(['FRU', 'Good Job!', 'Nailed It! Baking Bash']);
	});

	it.each([
		['FRU', ['Xbox One'], 'Co-founder & programmer'],
		['Good Job!', ['Nintendo Switch'], 'Programmer'],
		['Nailed It! Baking Bash', ['iOS', 'Android'], 'Programmer (multiplayer systems)'],
	])('records the platforms and role for %s', (title, platforms, role) => {
		expect(byTitle(title)).toMatchObject({ platforms, role });
	});
});
