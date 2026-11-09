// Lighthouse CI: audits the built site in dist/ and fails when any category scores below 90, or any
// accessibility audit fails, on the pages below. Run `npm run build` first.
// `npm run lighthouse` (scripts/lighthouse.mjs) serves dist/ with `astro preview` on `host` and
// `port` below, under the `/Portfolio/` base path so its links and assets resolve as they do on
// GitHub Pages, and fails unless that preview holds the port; then it runs `lhci autorun` against
// it. lhci doesn't start a server itself: it only warns when one doesn't come up and audits whatever
// answers on the port.
// `/Portfolio` is `base` in astro.config.mjs: keep the two in sync. The port avoids
// `astro preview`'s default 4321, which `npm run dev` also uses. The preview binds, and lhci audits,
// one address (not `localhost`, which may resolve to `::1` or `127.0.0.1`), so a server on another
// loopback address can't answer in its place.
const host = '127.0.0.1';
const port = 4400;
const origin = `http://${host}:${port}/Portfolio`;

const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const categoryMinimums = Object.fromEntries(
	categories.map((category) => [`categories:${category}`, ['error', { minScore: 0.9 }]]),
);

// A single accessibility failure, such as one image without `alt`, can leave the category above 90,
// so every audit that counts towards the accessibility score must also pass on its own. The list
// comes from the Lighthouse that `@lhci/cli` runs (resolved from its folder, not whichever copy npm
// hoists), so it follows Lighthouse upgrades.
const lhciDir = require('node:path').dirname(require.resolve('@lhci/cli/package.json'));
const { default: lighthouseConfig } = require(
	require.resolve('lighthouse/core/config/default-config.js', { paths: [lhciDir] }),
);
const accessibilityAudits = Object.fromEntries(
	lighthouseConfig.categories.accessibility.auditRefs
		.filter((audit) => audit.weight > 0)
		.map((audit) => [audit.id, 'error']),
);

module.exports = {
	// Not lhci config (lhci only reads `ci`): where scripts/lighthouse.mjs serves dist/.
	host,
	port,
	ci: {
		collect: {
			url: [
				`${origin}/`,
				// A game page (src/content/games/) and a featured project page (src/content/projects/).
				`${origin}/games/good-job/`,
				`${origin}/projects/zeepkist-gtr/`,
			],
			// Lighthouse's default mobile emulation. Three runs per page, of which the assertions take
			// the best (lhci's default `optimistic` aggregation), so a run slowed by a busy machine
			// doesn't fail the job.
			numberOfRuns: 3,
		},
		assert: {
			assertions: {
				...categoryMinimums,
				...accessibilityAudits,
			},
		},
		upload: {
			// Writes an HTML and JSON report per page here; CI uploads the folder as an artifact.
			target: 'filesystem',
			outputDir: '.lighthouseci/reports',
		},
	},
};
