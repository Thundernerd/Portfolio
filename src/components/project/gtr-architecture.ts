/**
 * The pieces of Zeepkist GTR and how they talk to each other, laid out for
 * `GtrArchitecture.astro`. Coordinates are in the SVG's user units (see `viewBox`).
 */

export type NodeId =
	| 'mod'
	| 'discord'
	| 'auth'
	| 'backend'
	| 'rabbitmq'
	| 'stream'
	| 'points'
	| 'level-score'
	| 'wr'
	| 'pb'
	| 'media'
	| 'db'
	| 'graphql';

export interface DiagramNode {
	id: NodeId;
	label: string;
	/** A second, quieter line: what the piece is. */
	sub: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const viewBox = { width: 800, height: 568 } as const;

const row = (n: number) => 20 + n * 96;
const box = { height: 48 } as const;

export const nodes: readonly DiagramNode[] = [
	{ id: 'mod', label: 'Zeepkist mod', sub: 'BepInEx', x: 300, y: row(0), width: 160, ...box },
	{ id: 'discord', label: 'Discord', sub: 'bot', x: 620, y: row(0), width: 160, ...box },
	{ id: 'auth', label: 'Auth', sub: 'Steam sign-in, JWT', x: 60, y: row(1), width: 180, ...box },
	{ id: 'backend', label: 'Backend / JsonApi', sub: 'REST API', x: 260, y: row(1), width: 300, ...box },
	{ id: 'rabbitmq', label: 'RabbitMQ', sub: 'message bus', x: 420, y: row(2), width: 140, ...box },
	{ id: 'stream', label: 'Stream', sub: 'WebSocket server', x: 620, y: row(2), width: 140, ...box },
	{ id: 'points', label: 'Player points', sub: 'scheduled', x: 20, y: row(3), width: 120, ...box },
	{ id: 'level-score', label: 'Level scores', sub: 'scheduled', x: 160, y: row(3), width: 120, ...box },
	{ id: 'wr', label: 'World records', sub: 'processor', x: 300, y: row(3), width: 120, ...box },
	{ id: 'pb', label: 'Personal bests', sub: 'processor', x: 440, y: row(3), width: 120, ...box },
	{ id: 'media', label: 'Record media', sub: 'handler', x: 580, y: row(3), width: 120, ...box },
	{ id: 'db', label: 'PostgreSQL', sub: 'database', x: 20, y: row(4), width: 760, ...box },
	{ id: 'graphql', label: 'GraphQL', sub: 'PostGraphile', x: 300, y: row(5), width: 160, ...box },
];

export interface DiagramEdge {
	from: NodeId;
	to: NodeId;
	/** The line's points, from the `from` box's edge to the `to` box's edge (where the arrowhead is). */
	points: readonly (readonly [number, number])[];
	/** A short note on what travels along the arrow, centred on `at`. */
	note?: { text: string; at: readonly [number, number] };
	/** Part of a record's path from the mod to the processors, drawn in the accent colour. */
	recordPath?: boolean;
}

/** Arrows point from the piece that calls, sends or queries to the one it reaches. */
export const edges: readonly DiagramEdge[] = [
	{ from: 'mod', to: 'auth', points: [[320, 68], [190, 116]], note: { text: 'sign in', at: [236, 86] } },
	{ from: 'mod', to: 'backend', points: [[420, 68], [420, 116]], note: { text: 'records', at: [452, 96] }, recordPath: true },
	{ from: 'backend', to: 'rabbitmq', points: [[490, 164], [490, 212]], note: { text: 'wr · pb · media', at: [404, 192] }, recordPath: true },
	{ from: 'rabbitmq', to: 'wr', points: [[440, 260], [372, 308]], recordPath: true },
	{ from: 'wr', to: 'rabbitmq', points: [[408, 308], [470, 260]] },
	{ from: 'rabbitmq', to: 'pb', points: [[510, 260], [510, 308]], recordPath: true },
	{ from: 'rabbitmq', to: 'media', points: [[550, 260], [620, 308]], recordPath: true },
	{ from: 'rabbitmq', to: 'stream', points: [[560, 236], [620, 236]], note: { text: 'new WRs', at: [590, 228] } },
	{ from: 'stream', to: 'discord', points: [[690, 212], [690, 68]], note: { text: 'WebSocket', at: [651, 146] } },
	{ from: 'auth', to: 'db', points: [[150, 164], [150, 404]] },
	{ from: 'backend', to: 'db', points: [[290, 164], [290, 404]] },
	{ from: 'points', to: 'db', points: [[80, 356], [80, 404]] },
	{ from: 'level-score', to: 'db', points: [[220, 356], [220, 404]] },
	{ from: 'wr', to: 'db', points: [[360, 356], [360, 404]] },
	{ from: 'pb', to: 'db', points: [[500, 356], [500, 404]] },
	{ from: 'media', to: 'db', points: [[640, 356], [640, 404]] },
	{ from: 'discord', to: 'db', points: [[770, 68], [770, 404]] },
	{ from: 'graphql', to: 'db', points: [[380, 500], [380, 452]], note: { text: 'reads', at: [406, 480] } },
];
