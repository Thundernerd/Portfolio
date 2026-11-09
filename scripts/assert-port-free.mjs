// @ts-check
/**
 * Prelighthouse step: fails `npm run lighthouse` when its port (`port` in `lighthouserc.cjs`) is
 * already taken. lhci only warns when its `astro preview` doesn't come up, then audits whatever
 * answers on the port, so a stale server there would be audited, and pass, in place of dist/.
 */
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/**
 * Hosts to try listening on: every address, then each loopback address `localhost` may resolve to.
 * Linux refuses the wildcard while any address holds the port, but macOS and the BSDs allow it next
 * to a server bound to `127.0.0.1` or `::1`, so those are tried as well.
 */
const hosts = [undefined, '127.0.0.1', '::1'];

/** Errors that mean the host doesn't exist on this machine (no IPv6), not that the port is taken. */
const unavailable = new Set(['EADDRNOTAVAIL', 'EAFNOSUPPORT']);

/**
 * Briefly listens on `port` on `host` (every address when undefined), resolving once it is released.
 * @param {number} port
 * @param {string | undefined} host
 * @returns {Promise<void>}
 */
function tryListen(port, host) {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once('error', reject);
		server.listen(port, host, () => server.close(() => resolve()));
	});
}

/**
 * Resolves when nothing listens on `port`, by briefly listening on it on every address and on each
 * loopback address, and rejects with a message naming the port otherwise.
 * @param {number} port
 * @returns {Promise<void>}
 */
export async function assertPortFree(port) {
	for (const host of hosts) {
		try {
			await tryListen(port, host);
		} catch (caught) {
			const error = /** @type {NodeJS.ErrnoException} */ (caught);
			if (error.code && unavailable.has(error.code)) continue;
			throw new Error(
				`Port ${port} is already in use (${error.code ?? error.message}), so Lighthouse would ` +
					`audit whatever is listening there instead of dist/. Stop it (for example a stale ` +
					'`astro preview`) and run `npm run lighthouse` again.',
			);
		}
	}
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	const { port } = createRequire(import.meta.url)('../lighthouserc.cjs');
	try {
		await assertPortFree(port);
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}
