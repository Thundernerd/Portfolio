// Lighthouse CI (`npx lhci autorun`): audits the built site in dist/ and fails when any category
// scores below 90, or any accessibility audit fails, on the pages below. Run `npm run build` first.
// `astro preview` serves dist/ under the `/Portfolio/` base path, so its links and assets resolve as
// they do on GitHub Pages.
const origin = 'http://localhost:4321/Portfolio';

// A single accessibility failure, such as one image without `alt`, can leave the category above 90,
// so every audit that counts towards the accessibility score must also pass on its own. The list
// comes from the Lighthouse that `@lhci/cli` runs, so it follows Lighthouse upgrades.
const { default: lighthouseConfig } = require('lighthouse/core/config/default-config.js');
const accessibilityAudits = Object.fromEntries(
	lighthouseConfig.categories.accessibility.auditRefs
		.filter((audit) => audit.weight > 0)
		.map((audit) => [audit.id, 'error']),
);

module.exports = {
	ci: {
		collect: {
			startServerCommand: 'npm run preview',
			startServerReadyPattern: 'localhost:4321',
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
				'categories:performance': ['error', { minScore: 0.9 }],
				'categories:accessibility': ['error', { minScore: 0.9 }],
				'categories:best-practices': ['error', { minScore: 0.9 }],
				'categories:seo': ['error', { minScore: 0.9 }],
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
