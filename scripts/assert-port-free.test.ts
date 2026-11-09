import { createServer, type Server } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { assertPortFree } from './assert-port-free.mjs';

let server: Server | undefined;

afterEach(async () => {
	await new Promise((resolve) => (server ? server.close(resolve) : resolve(undefined)));
	server = undefined;
});

/** Starts a test server on a free port on `host` and returns that port. */
async function holdPort(host: string) {
	server = createServer();
	await new Promise<void>((resolve) => server!.listen(0, host, resolve));
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('no port');
	return address.port;
}

describe('assertPortFree()', () => {
	it('rejects with a message naming the port when a server holds it', async () => {
		const port = await holdPort('localhost');
		await expect(assertPortFree(port)).rejects.toThrow(String(port));
	});

	it('resolves when the port is free', async () => {
		const port = await holdPort('localhost');
		await new Promise((resolve) => server!.close(resolve));
		server = undefined;
		await expect(assertPortFree(port)).resolves.toBeUndefined();
	});
});
