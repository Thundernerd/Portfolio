import { createServer, type Server } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { assertPortFree } from './assert-port-free.mjs';

let server: Server | undefined;

/** Starts a test server on a free port on `host` and returns that port. */
async function holdPort(host: string) {
	server = createServer();
	await new Promise<void>((resolve) => server!.listen(0, host, resolve));
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('no port');
	return address.port;
}

/** Stops the test server, if one is running. */
async function releasePort() {
	await new Promise((resolve) => (server ? server.close(resolve) : resolve(undefined)));
	server = undefined;
}

afterEach(releasePort);

describe('assertPortFree()', () => {
	// `astro preview` listens on `localhost`, which resolves to one of the loopback addresses.
	it.each(['localhost', '127.0.0.1', '::1'])(
		'rejects with a message naming the port when a server on %s holds it',
		async (host) => {
			const port = await holdPort(host);
			await expect(assertPortFree(port)).rejects.toThrow(`Port ${port} is already in use`);
		},
	);

	it('resolves when the port is free', async () => {
		const port = await holdPort('localhost');
		await releasePort();
		await expect(assertPortFree(port)).resolves.toBeUndefined();
	});
});
