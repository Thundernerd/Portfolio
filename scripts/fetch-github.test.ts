import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { run } from './fetch-github.mjs';

let root: string;
let contentDir: string;
let outFile: string;

beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'fetch-github-'));
	contentDir = join(root, 'projects');
	outFile = join(root, 'out', 'github-stats.json');
	await mkdir(contentDir, { recursive: true });
});

/** Writes a project entry fixture with the given frontmatter lines. */
async function project(file: string, frontmatter: string) {
	const path = join(contentDir, file);
	await mkdir(join(path, '..'), { recursive: true });
	await writeFile(path, `---\n${frontmatter}\n---\n\nBody text.\n`);
}

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

const silent = { warn: () => {} };

async function readOut() {
	return JSON.parse(await readFile(outFile, 'utf8'));
}

describe('fetch-github run()', () => {
	it('writes only the star count and language for a repo referenced in the content', async () => {
		await project('zeepsdk.md', 'title: ZeepSDK\nrepo: donderjoekel/ZeepSDK\nkind: zeepkist-mod\nblurb: SDK.');
		const requested: string[] = [];
		const fetch = async (url: string | URL | Request) => {
			requested.push(String(url));
			return json(200, { stargazers_count: 42, language: 'C#', description: 'A modding SDK' });
		};

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(requested).toEqual(['https://api.github.com/repos/donderjoekel/ZeepSDK']);
		expect(await readOut()).toEqual({ 'donderjoekel/ZeepSDK': { stars: 42, language: 'C#' } });
	});

	it.each([
		['archived', true],
		['not archived', false],
	])('records whether GitHub says the repo is %s', async (_, archived) => {
		await project('a.md', 'repo: Thundernerd/Repo');
		const fetch = async () => json(200, { stargazers_count: 5, archived });

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(await readOut()).toEqual({ 'Thundernerd/Repo': { stars: 5, language: null, archived } });
	});

	it.each([
		['missing', {}],
		['not a boolean', { archived: 'yes' }],
	])('leaves the archived flag unknown when it is %s from the response', async (_, extra) => {
		await project('a.md', 'repo: Thundernerd/Repo');
		const fetch = async () => json(200, { stargazers_count: 5, ...extra });

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(await readOut()).toStrictEqual({ 'Thundernerd/Repo': { stars: 5, language: null } });
	});

	it('leaves out a repo whose request fails, keeping the others and warning', async () => {
		await project('a.md', 'repo: Thundernerd/Offline');
		await project('b.md', 'repo: Thundernerd/Online');
		const warnings: string[] = [];
		const fetch = async (url: string | URL | Request) => {
			if (String(url).endsWith('/Offline')) throw new TypeError('fetch failed');
			return json(200, { stargazers_count: 7 });
		};

		await run({ contentDir, outFile, fetch, env: {}, log: { ...silent, warn: (m) => warnings.push(m) } });

		expect(await readOut()).toEqual({ 'Thundernerd/Online': { stars: 7, language: null } });
		expect(warnings.join('\n')).toContain('Thundernerd/Offline');
	});

	it('skips repo values that are not a GitHub owner/name', async () => {
		await project('url.md', 'repo: https://github.com/donderjoekel/ZeepSDK');
		await project('traversal.md', 'repo: Thundernerd/..');
		await project('bare.md', 'repo: ZeepSDK');
		let calls = 0;
		const fetch = async () => {
			calls += 1;
			return json(200, { stargazers_count: 1 });
		};

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(calls).toBe(0);
		expect(await readOut()).toEqual({});
	});

	it('stops requesting once a request times out, as the API is unreachable', async () => {
		await project('1.md', 'repo: Thundernerd/First');
		await project('2.md', 'repo: Thundernerd/Second');
		let calls = 0;
		const fetch = async () => {
			calls += 1;
			throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
		};

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(calls).toBe(1);
		expect(await readOut()).toEqual({});
	});

	it('leaves out a repo the API answers with an error status', async () => {
		await project('gone.md', 'repo: Thundernerd/Deleted');
		const fetch = async () => json(404, { message: 'Not Found' });

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(await readOut()).toEqual({});
	});

	it.each([
		['403 with no requests remaining', 403, { 'x-ratelimit-remaining': '0' }],
		['429', 429, {}],
		['403 secondary rate limit with retry-after', 403, { 'x-ratelimit-remaining': '42', 'retry-after': '60' }],
	])('stops requesting once rate-limited (%s), keeping what it already fetched', async (_, status, headers) => {
		await project('1.md', 'repo: Thundernerd/First');
		await project('2.md', 'repo: Thundernerd/Second');
		await project('3.md', 'repo: Thundernerd/Third');
		let calls = 0;
		const fetch = async () => {
			calls += 1;
			return calls === 1
				? json(200, { stargazers_count: 1, description: 'first' })
				: json(status, { message: 'API rate limit exceeded' }, headers);
		};

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(calls).toBe(2);
		expect(Object.values(await readOut())).toEqual([{ stars: 1, language: null }]);
	});

	it.each([
		['sends GITHUB_TOKEN as a bearer token when set', { GITHUB_TOKEN: 'secret' }, 'Bearer secret'],
		['sends no authorization without a token', {}, null],
	])('%s', async (_, env, expected) => {
		await project('a.md', 'repo: Thundernerd/Repo');
		let authorization: string | null = 'unset';
		const fetch = async (_url: string | URL | Request, init?: RequestInit) => {
			authorization = new Headers(init?.headers).get('authorization');
			return json(200, { stargazers_count: 0 });
		};

		await run({ contentDir, outFile, fetch, env, log: silent });

		expect(authorization).toBe(expected);
	});

	it('writes an empty file without requests when the content directory does not exist', async () => {
		let calls = 0;
		const fetch = async () => {
			calls += 1;
			return json(200, {});
		};

		await run({ contentDir: join(root, 'missing'), outFile, fetch, env: {}, log: silent });

		expect(calls).toBe(0);
		expect(await readOut()).toEqual({});
	});

	it('requests a repo once when several entries share it, and ignores entries without a repo', async () => {
		await project('nested/a.mdx', 'title: A\nrepo: "Thundernerd/Shared"');
		await project('b.md', "title: B\nrepo: 'Thundernerd/Shared' # same repo");
		await project('c.md', 'title: No repo here');
		const requested: string[] = [];
		const fetch = async (url: string | URL | Request) => {
			requested.push(String(url));
			return json(200, { stargazers_count: 3, description: 'shared' });
		};

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(requested).toEqual(['https://api.github.com/repos/Thundernerd/Shared']);
		expect(await readOut()).toEqual({ 'Thundernerd/Shared': { stars: 3, language: null } });
	});

	it.each([
		['null', null],
		['missing', undefined],
		['not a string', 42],
		['empty', ''],
	])('writes a null language when GitHub reports it as %s', async (_, language) => {
		await project('a.md', 'repo: Thundernerd/Docs');
		const fetch = async () => json(200, { stargazers_count: 5, language });

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(await readOut()).toEqual({ 'Thundernerd/Docs': { stars: 5, language: null } });
	});

	it.each([
		['without a star count', { description: 'no stars' }],
		['that is not JSON', 'Service Unavailable'],
	])('leaves out a repo whose response body is %s', async (_, body) => {
		await project('a.md', 'repo: Thundernerd/Odd');
		const fetch = async () =>
			typeof body === 'string' ? new Response(body, { status: 200 }) : json(200, body);

		await run({ contentDir, outFile, fetch, env: {}, log: silent });

		expect(await readOut()).toEqual({});
	});
});
