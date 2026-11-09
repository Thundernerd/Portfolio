// Lighthouse CI (`npm run lighthouse`): audits the built site in dist/ and fails when any category
// scores below 90, or any accessibility audit fails, on the pages below. Run `npm run build` first.
// `astro preview` serves dist/ under the `/Portfolio/` base path, so its links and assets resolve as
// they do on GitHub Pages.
// `/Portfolio` is `base` in astro.config.mjs: keep the two in sync. lhci audits whatever answers on
// this port, so it avoids `astro preview`'s default 4321, which `npm run dev` also uses. The
// `prelighthouse` step (scripts/assert-port-free.mjs) reads it from `port` below and fails the run
// when something already listens there.
const port = 4400;
const host = `localhost:${port}`;
const origin = `http://${host}/Portfolio`;

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
	// Not lhci config (lhci only reads `ci`): the port the `prelighthouse` step checks.
	port,
	ci: {
		collect: {
			// `--ignore-lock` keeps the server in the foreground, so lhci stops it when it's done: when
			// `astro preview` detects an AI agent it otherwise moves itself to the background and outlives
			// the run.
			startServerCommand: `npm run preview -- --ignore-lock --port ${port}`,
			startServerReadyPattern: host,
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
