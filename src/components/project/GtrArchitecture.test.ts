import { beforeEach, describe, expect, it } from 'vitest';
import { type AstroContainer, createContainer } from '../test-fixtures';
import GtrArchitecture from './GtrArchitecture.astro';

describe('GtrArchitecture', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	const render = () => container.renderToString(GtrArchitecture);

	/** The labels of the boxes in the diagram, by their `data-node` id. */
	const nodes = (html: string) =>
		Object.fromEntries(
			[...html.matchAll(/<g[^>]*data-node="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)].map(([, id, body]) => [
				id,
				[...body.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' '),
			]),
		);

	it('draws a labelled box for each part of GTR', async () => {
		expect(nodes(await render())).toEqual({
			mod: 'Zeepkist mod BepInEx',
			auth: 'Auth Steam sign-in, JWT',
			backend: 'Backend / JsonApi REST API',
			rabbitmq: 'RabbitMQ message bus',
			stream: 'Stream WebSocket server',
			discord: 'Discord bot',
			points: 'Player points scheduled',
			'level-score': 'Level scores scheduled',
			wr: 'World records processor',
			pb: 'Personal bests processor',
			media: 'Record media handler',
			db: 'PostgreSQL database',
			graphql: 'GraphQL PostGraphile',
		});
	});

	/** The arrows in the diagram, as `from -> to` pairs, sorted. */
	const edges = (html: string) =>
		[...html.matchAll(/<g[^>]*data-from="([^"]+)"[^>]*data-to="([^"]+)"/g)].map(([, from, to]) => `${from} -> ${to}`).sort();

	it('connects the parts the way records flow through them', async () => {
		expect(edges(await render())).toEqual(
			[
				'mod -> auth',
				'mod -> backend',
				'backend -> rabbitmq',
				'rabbitmq -> wr',
				'rabbitmq -> pb',
				'rabbitmq -> media',
				'wr -> rabbitmq',
				'rabbitmq -> stream',
				'stream -> discord',
				'auth -> db',
				'backend -> db',
				'points -> db',
				'level-score -> db',
				'wr -> db',
				'pb -> db',
				'media -> db',
				'discord -> db',
				'graphql -> db',
			].sort(),
		);
	});

	it('only connects boxes that are drawn', async () => {
		const html = await render();
		const ids = Object.keys(nodes(html));
		for (const edge of edges(html)) expect(ids).toEqual(expect.arrayContaining(edge.split(' -> ')));
	});

	it('is an image named and described for screen readers', async () => {
		const html = await render();
		const svg = /<svg[^>]*>/.exec(html)?.[0] ?? '';
		expect(svg).toContain('role="img"');
		const [, titleId, descId] = /aria-labelledby="([^" ]+) ([^" ]+)"/.exec(svg) ?? [];
		expect(html).toMatch(new RegExp(`<title id="${titleId}">Zeepkist GTR architecture</title>`));
		const desc = new RegExp(`<desc id="${descId}">([^<]+)</desc>`).exec(html)?.[1] ?? '';
		for (const part of ['mod', 'Auth', 'Backend', 'RabbitMQ', 'PostgreSQL', 'GraphQL', 'Stream', 'Discord']) {
			expect(desc).toContain(part);
		}
	});

	it('leaves its colours to the stylesheet, so it follows the light and dark themes', async () => {
		const svg = /<svg[\s\S]*<\/svg>/.exec(await render())?.[0] ?? '';
		expect(svg).not.toMatch(/\s(fill|stroke|color|stop-color|style)="/);
		expect(svg).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
	});
});
