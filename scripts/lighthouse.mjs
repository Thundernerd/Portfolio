// @ts-check
/**
 * `npm run lighthouse`: serves dist/ with `astro preview` on the Lighthouse address (`host` and
 * `port` in `lighthouserc.cjs`), runs `lhci autorun` against it and stops the preview afterwards.
 *
 * lhci only warns when a server it starts itself doesn't come up, then audits whatever answers on
 * the port, and a check made before starting the server leaves a window for another to take the
 * port. So this starts the server first and fails unless it holds the port: the server lhci audits
 * is then always this build's preview.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

/**
 * The path of a package's own file, such as its CLI, which its `exports` may not expose.
 * @param {string} name
 * @param {string} file
 */
const packageFile = (name, file) => join(dirname(require.resolve(`${name}/package.json`)), file);

/** Matches the first URL the preview prints for itself, capturing its port. */
const servedUrl = /http:\/\/[^\s/"]+:(\d+)\//;

/** Strips terminal colours, which `astro preview` adds when its output is a terminal. */
const ansi = /\x1b\[[0-9;]*m/g;

/** How long the preview may take to start serving, as lhci's own `startServerReadyTimeout`. */
const readyTimeoutMs = 10_000;

/**
 * @typedef {object} Preview
 * @property {string} origin The served site's origin, such as `http://127.0.0.1:4400`.
 * @property {() => Promise<void>} stop Stops the server, resolving once it has exited.
 */

/**
 * Starts `astro preview` on `host`:`port`, resolving once it serves there. Rejects with a message
 * naming the port when the preview can't bind it (Vite then moves to another port), and when it
 * exits or hasn't started serving within {@link readyTimeoutMs}; it is stopped then.
 * @param {{ host: string, port: number, outDir?: string }} options `outDir`: the build to serve,
 *   dist/ by default.
 * @returns {Promise<Preview>}
 */
export function startPreview({ host, port, outDir }) {
	const astro = packageFile('astro', 'bin/astro.mjs');
	// `--ignore-lock` keeps the server in the foreground: when `astro preview` detects an AI agent it
	// otherwise moves itself to the background and outlives the run.
	const args = [astro, 'preview', '--ignore-lock', '--host', host, '--port', String(port)];
	if (outDir) args.push('--outDir', outDir);
	const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
	const exited = new Promise((resolve) => child.once('exit', resolve));
	const stop = async () => {
		if (child.exitCode === null && child.signalCode === null) child.kill();
		await exited;
	};

	return new Promise((resolve, reject) => {
		let output = '';
		let settled = false;
		/** @param {Error} error */
		const fail = (error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			stop().then(() => reject(error));
		};
		const timer = setTimeout(
			() => fail(new Error(`\`astro preview\` didn't start serving on port ${port}:\n${output}`)),
			readyTimeoutMs,
		);
		/** @param {Buffer} chunk */
		const onData = (chunk) => {
			output += chunk.toString().replace(ansi, '');
			const match = servedUrl.exec(output);
			if (!match || settled) return;
			if (Number(match[1]) !== port) {
				fail(
					new Error(
						`Port ${port} is already in use, so Lighthouse would audit whatever is listening there ` +
							'instead of dist/. Stop it (for example a stale `astro preview`) and run ' +
							'`npm run lighthouse` again.',
					),
				);
				return;
			}
			settled = true;
			clearTimeout(timer);
			resolve({ origin: `http://${host}:${port}`, stop });
		};
		child.stdout.on('data', onData);
		child.stderr.on('data', onData);
		child.once('error', fail);
		child.once('exit', (code, signal) =>
			fail(
				new Error(
					`\`astro preview\` exited (${signal ?? `code ${code}`}) before serving on port ${port}:\n` +
						output,
				),
			),
		);
	});
}

/**
 * Runs `lhci autorun` in the foreground, resolving with its exit code.
 * @returns {Promise<number>}
 */
function runLhci() {
	const lhci = packageFile('@lhci/cli', 'src/cli.js');
	const child = spawn(process.execPath, [lhci, 'autorun'], { stdio: 'inherit' });
	return new Promise((resolve, reject) => {
		child.once('error', reject);
		child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
	});
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	const { host, port } = require('../lighthouserc.cjs');
	/** @type {Preview} */
	let preview;
	try {
		preview = await startPreview({ host, port });
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
	let code = 1;
	try {
		code = await runLhci();
	} finally {
		await preview.stop();
	}
	process.exit(code);
}
