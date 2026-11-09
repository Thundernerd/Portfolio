import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startPreview } from './lighthouse.mjs';

let server: Server | undefined;
let outDir: string;

/** Starts a test server on `port` (a free one by default) on `host` and returns its port. */
async function holdPort(host: string, port = 0) {
	server = createServer();
	await new Promise<void>((resolve, reject) => {
		server!.once('error', reject);
		server!.listen(port, host, resolve);
	});
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('no port');
	return address.port;
}

/** Stops the test server, if one is running. */
async function releasePort() {
	await new Promise((resolve) => (server ? server.close(resolve) : resolve(undefined)));
	server = undefined;
}

// `astro preview` refuses to start without a build, so it serves a stand-in for dist/.
beforeEach(async () => {
	outDir = await mkdtemp(join(tmpdir(), 'lighthouse-test-'));
	await writeFile(join(outDir, 'index.html'), '<!doctype html><title>test</title>');
});

afterEach(async () => {
	await releasePort();
	await rm(outDir, { recursive: true, force: true });
});

describe('startPreview()', () => {
	it('rejects with a message naming the port when a server already holds it', async () => {
		const port = await holdPort('127.0.0.1');
		await expect(startPreview({ host: '127.0.0.1', port, outDir })).rejects.toThrow(`Port ${port} is already in use`);
	}, 30_000);

	it('serves the build on the port, and releases it when stopped', async () => {
		const port = await holdPort('127.0.0.1');
		await releasePort();
		const preview = await startPreview({ host: '127.0.0.1', port, outDir });
		try {
			const response = await fetch(`http://127.0.0.1:${port}/Portfolio/`);
			expect(await response.text()).toContain('<title>test</title>');
		} finally {
			await preview.stop();
		}
		await holdPort('127.0.0.1', port);
	}, 30_000);
});
