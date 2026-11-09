// The `prelighthouse` step: fails `npm run lighthouse` when its port is already taken. lhci only
// warns when its `astro preview` doesn't come up, then audits whatever answers on the port, so a
// stale server there would be audited, and pass, in place of dist/.
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/**
 * Resolves when nothing listens on `port`, by briefly listening on it on every address, and
 * rejects with a message naming the port otherwise.
 * @param {number} port
 * @returns {Promise<void>}
 */
export function assertPortFree(port) {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once('error', (error) => {
			reject(
				new Error(
					`Port ${port} is already in use (${error.code ?? error.message}), so Lighthouse would ` +
						`audit whatever is listening there instead of dist/. Stop it (for example a stale ` +
						'`astro preview`) and run `npm run lighthouse` again.',
				),
			);
		});
		server.listen(port, () => server.close(() => resolve()));
	});
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
