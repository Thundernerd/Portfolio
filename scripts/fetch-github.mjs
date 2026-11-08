// @ts-check
/**
 * Prebuild step: fetches star counts from the GitHub API for every `repo` in the content and writes
 * them to `src/data/github-stats.json`, which `src/lib/github-stats.ts` reads.
 *
 * It never fails the build over GitHub: no token is required (`GITHUB_TOKEN` is used when set), and a
 * repo that can't be fetched (offline, rate-limited, missing) is left out of the file, so the site
 * falls back to the entry's frontmatter values.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * @typedef {import('../src/lib/github-stats').RepoStats} RepoStats
 * @typedef {{ warn: (message: string) => void }} Log
 * @typedef {object} RunOptions
 * @property {string} contentDir Directory searched (recursively) for `.md`/`.mdx` entries.
 * @property {string} outFile JSON file the stats are written to.
 * @property {typeof globalThis.fetch} fetch
 * @property {Record<string, string | undefined>} env
 * @property {Log} log
 */

/** @param {string} dir */
async function contentFiles(dir) {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});
	return entries
		.filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
		.map((entry) => join(entry.parentPath, entry.name))
		.sort();
}

/**
 * The distinct `repo` values in the frontmatter of the content under `dir`, in file order.
 * @param {string} dir
 */
async function reposIn(dir) {
	const repos = new Set();
	for (const file of await contentFiles(dir)) {
		const repo = repoOf(await readFile(file, 'utf8'));
		if (repo) repos.add(repo);
	}
	return [...repos];
}

// Same pattern as `repo` in src/content/schemas.ts, which the build enforces later; values it would
// reject are not sent to the API.
const ownerAndName = /^[A-Za-z0-9-]+\/(?!\.\.?$)[\w.-]+$/;

/**
 * The `repo` frontmatter value of a content file, if it is a GitHub `owner/name`.
 * @param {string} source
 */
function repoOf(source) {
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
	const repo = frontmatter.match(/^repo:\s*['"]?([^'"\s#]+)/m)?.[1];
	return repo && ownerAndName.test(repo) ? repo : undefined;
}

/**
 * A primary (`x-ratelimit-remaining: 0`) or secondary (`retry-after`) rate limit; see
 * https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
 * @param {Response} response
 */
function isRateLimited(response) {
	if (response.status === 429) return true;
	return response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after'));
}

/** @param {RunOptions} options */
export async function run({ contentDir, outFile, fetch, env, log }) {
	/** @type {Record<string, string>} */
	const headers = { accept: 'application/vnd.github+json', 'user-agent': 'portfolio-build' };
	if (env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;
	/** @type {Record<string, RepoStats>} */
	const stats = {};
	for (const repo of await reposIn(contentDir)) {
		try {
			const response = await fetch(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(10_000) });
			if (isRateLimited(response)) {
				log.warn(`fetch-github: rate-limited by the GitHub API (HTTP ${response.status}); remaining repos use frontmatter values`);
				break;
			}
			if (!response.ok) {
				log.warn(`fetch-github: ${repo}: HTTP ${response.status}; using frontmatter values`);
				continue;
			}
			const body = await response.json();
			if (!Number.isInteger(body?.stargazers_count)) {
				log.warn(`fetch-github: ${repo}: unexpected response; using frontmatter values`);
				continue;
			}
			stats[repo] = { stars: body.stargazers_count };
		} catch (error) {
			// A hung connection would cost the timeout again for every remaining repo; give up instead.
			if (error instanceof Error && error.name === 'TimeoutError') {
				log.warn(`fetch-github: ${repo}: timed out; remaining repos use frontmatter values`);
				break;
			}
			log.warn(`fetch-github: ${repo}: ${error instanceof Error ? error.message : error}; using frontmatter values`);
		}
	}
	await mkdir(dirname(outFile), { recursive: true });
	await writeFile(outFile, `${JSON.stringify(stats, null, '\t')}\n`);
}

// Run as a script (`npm run build` runs it as `prebuild`): scan all content, write next to the site code.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	const root = fileURLToPath(new URL('..', import.meta.url));
	await run({
		contentDir: join(root, 'src/content'),
		outFile: join(root, 'src/data/github-stats.json'),
		fetch: globalThis.fetch,
		env: process.env,
		log: console,
	});
}
