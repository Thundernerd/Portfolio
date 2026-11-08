import { describe, expect, it } from 'vitest';
import { GROUND_Y, WIDTH, autopilot, createGame, step } from './kart';

const idle = { left: false, right: false, jump: false };
const run = (game: ReturnType<typeof createGame>, seconds: number, input = idle) => {
	for (let t = 0; t < seconds; t += 1 / 60) step(game, input, 1 / 60);
	return game;
};

describe('kart game', () => {
	it('starts with the kart resting on the road and no score', () => {
		const game = createGame({ seed: 1 });
		expect(game.kart.y).toBe(GROUND_Y);
		expect(game.score).toBe(0);
	});

	it('jumps off the road and lands back on it', () => {
		const game = createGame({ seed: 1 });
		step(game, { ...idle, jump: true }, 1 / 60);
		run(game, 0.2);
		expect(game.kart.y).toBeLessThan(GROUND_Y - 10);
		run(game, 2);
		expect(game.kart.y).toBe(GROUND_Y);
	});

	it('steers left and right but never leaves the scene', () => {
		const game = createGame({ seed: 1 });
		const start = game.kart.x;
		run(game, 0.25, { ...idle, right: true });
		expect(game.kart.x).toBeGreaterThan(start);
		run(game, 10, { ...idle, right: true });
		expect(game.kart.x).toBeLessThanOrEqual(WIDTH);
		run(game, 10, { ...idle, left: true });
		expect(game.kart.x).toBeGreaterThanOrEqual(0);
		expect(game.kart.x).toBeLessThan(start);
	});

	it('collects a star the kart touches, scoring a point and sending the star back out ahead', () => {
		const game = createGame({ seed: 1 });
		game.stars = [{ x: game.kart.x, y: GROUND_Y - 8 }, { x: WIDTH - 10, y: 40 }];
		step(game, idle, 1 / 60);
		expect(game.score).toBe(1);
		expect(game.stars).toHaveLength(2);
		expect(game.stars[0].x).toBeGreaterThan(WIDTH);
	});

	it('leaves stars out of reach alone', () => {
		const game = createGame({ seed: 1 });
		game.stars = [{ x: game.kart.x, y: 20 }];
		step(game, idle, 1 / 60);
		expect(game.score).toBe(0);
	});

	it('scrolls the stars towards the kart and brings missed ones round again', () => {
		const game = createGame({ seed: 7 });
		const count = game.stars.length;
		expect(count).toBeGreaterThan(0);
		const before = game.stars.map((star) => star.x);
		step(game, idle, 1 / 60);
		game.stars.forEach((star, i) => expect(star.x).toBeLessThan(before[i]));
		run(game, 30);
		expect(game.stars).toHaveLength(count);
		game.stars.forEach((star) => expect(star.x).toBeGreaterThan(-16));
	});

	it('scores double in turbo mode', () => {
		const game = createGame({ seed: 1 });
		game.turbo = true;
		game.stars = [{ x: game.kart.x, y: GROUND_Y - 8 }];
		step(game, idle, 1 / 60);
		expect(game.score).toBe(2);
	});

	it('places the same stars for the same seed', () => {
		expect(createGame({ seed: 3 }).stars).toEqual(createGame({ seed: 3 }).stars);
		expect(createGame({ seed: 3 }).stars).not.toEqual(createGame({ seed: 4 }).stars);
	});

	describe('autopilot', () => {
		it('jumps for a high star coming up just ahead', () => {
			const game = createGame({ seed: 1 });
			game.stars = [{ x: game.kart.x + 30, y: GROUND_Y - 50 }];
			expect(autopilot(game).jump).toBe(true);
		});

		it('keeps rolling when no star is close', () => {
			const game = createGame({ seed: 1 });
			game.stars = [{ x: game.kart.x + 200, y: GROUND_Y - 50 }, { x: game.kart.x - 40, y: GROUND_Y - 50 }];
			expect(autopilot(game)).toEqual({ left: false, right: false, jump: false });
		});

		it('collects stars on its own when left to drive', () => {
			const game = createGame({ seed: 5 });
			for (let t = 0; t < 20; t += 1 / 60) step(game, autopilot(game), 1 / 60);
			expect(game.score).toBeGreaterThan(5);
		});
	});
});
