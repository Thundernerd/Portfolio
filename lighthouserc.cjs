// Lighthouse CI (`npm run lighthouse`): audits the built site in dist/ and fails when any category
// scores below 90, or any accessibility audit fails, on the pages below. Run `npm run build` first.
// `astro preview` serves dist/ under the `/Portfolio/` base path, so its links and assets resolve as
// they do on GitHub Pages.
// `astro preview`'s default host; `/Portfolio` is `base` in astro.config.mjs: keep the two in sync.
const host = 'localhost:4321';
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
	ci: {
		collect: {
			startServerCommand: 'npm run preview',
			startServerReadyPattern: host,
			url: [
				`${origin}/`,
				// A game page (src/content/games/) and a featured project page (src/content/projects/).
				`${origin}/games/good-job/`,
				`${origin}/projects/zeepkist-gtr/`,
			],
			// Lighthouse's default mobile emulation, one run per page.
			numberOfRuns: 1,
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
