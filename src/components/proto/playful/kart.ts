/**
 * State and rules of the hero mini-game: a soapbox kart rolling along a road, steered left and right
 * and jumping to collect stars. Pure and frame-rate independent; `KartHero.astro` draws it.
 * Coordinates are in logical pixels of a WIDTH × HEIGHT scene, y growing downwards.
 */

export const WIDTH = 320;
export const HEIGHT = 180;
/** The road's surface: the y of the kart's wheels when it isn't jumping. */
export const GROUND_Y = 150;
/** Half the kart's width: how close its centre may come to the scene's edges. */
export const KART_HALF_WIDTH = 14;
const KART_HEIGHT = 24;
const STAR_RADIUS = 6;
const STAR_COUNT = 4;

const GRAVITY = 900;
/** Peaks a jump at about 60px, so every star (spawned at most 70px above the road) is reachable. */
const JUMP_SPEED = 330;
const STEER_SPEED = 140;
/** How fast the road (and so every star) scrolls past, in px/s. */
export const ROAD_SPEED = 80;

export interface Input {
	left: boolean;
	right: boolean;
	jump: boolean;
}

export interface Star {
	x: number;
	y: number;
}

export interface Game {
	kart: { x: number; y: number; vy: number };
	stars: Star[];
	score: number;
	/** How far the road has scrolled, for parallax. */
	distance: number;
	/** The Konami-code bonus: every star is worth two. */
	turbo: boolean;
	random: () => number;
}

/** mulberry32: a tiny seeded PRNG, so a seed always lays out the same stars. */
function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const starHeight = (random: () => number) => GROUND_Y - 10 - random() * 60;

/** Sends a star back out past the right edge at a new height. */
function respawn(star: Star, random: () => number) {
	star.x = WIDTH + STAR_RADIUS + 10 + random() * 120;
	star.y = starHeight(random);
}

export function createGame({ seed }: { seed: number }): Game {
	const random = seeded(seed);
	const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({ x: 140 + i * 70 + random() * 30, y: starHeight(random) }));
	return { kart: { x: 64, y: GROUND_Y, vy: 0 }, stars, score: 0, distance: 0, turbo: false, random };
}

const touches = (kart: Game['kart'], star: Star) =>
	Math.abs(star.x - kart.x) < KART_HALF_WIDTH + STAR_RADIUS &&
	star.y > kart.y - KART_HEIGHT - STAR_RADIUS &&
	star.y < kart.y + STAR_RADIUS;

/** Advances the game by `dt` seconds under the held `input`. */
export function step(game: Game, input: Input, dt: number): Game {
	const { kart } = game;
	const steer = Number(input.right) - Number(input.left);
	kart.x = Math.min(WIDTH - KART_HALF_WIDTH, Math.max(KART_HALF_WIDTH, kart.x + steer * STEER_SPEED * dt));
	if (input.jump && kart.y >= GROUND_Y) kart.vy = -JUMP_SPEED;
	kart.vy += GRAVITY * dt;
	kart.y = Math.min(GROUND_Y, kart.y + kart.vy * dt);
	if (kart.y === GROUND_Y) kart.vy = 0;

	game.distance += ROAD_SPEED * dt;
	for (const star of game.stars) {
		star.x -= ROAD_SPEED * dt;
		if (touches(kart, star)) {
			game.score += game.turbo ? 2 : 1;
			respawn(star, game.random);
		} else if (star.x < -STAR_RADIUS) {
			respawn(star, game.random);
		}
	}
	return game;
}

/** How far ahead of the kart a star may be for the autopilot to jump for it, in px. */
const JUMP_LEAD = 36;

/**
 * The input an idle kart drives itself with (the arcade "attract mode"): it jumps when a star it
 * can't reach from the road is about to pass overhead, and otherwise just rolls.
 */
export function autopilot(game: Game): Input {
	const { kart } = game;
	const jump = game.stars.some((star) => {
		const ahead = star.x - kart.x;
		return ahead > 0 && ahead < JUMP_LEAD && star.y < GROUND_Y - KART_HEIGHT - STAR_RADIUS;
	});
	return { left: false, right: false, jump };
}
