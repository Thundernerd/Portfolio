// Lighthouse CI (`npx lhci autorun`): audits the built site in dist/ and fails when any category
// scores below 90 on the pages below. Run `npm run build` first. `astro preview` serves dist/ under
// the `/Portfolio/` base path, so its links and assets resolve as they do on GitHub Pages.
const origin = 'http://localhost:4321/Portfolio';

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
			},
		},
		upload: {
			// Writes an HTML and JSON report per page here; CI uploads the folder as an artifact.
			target: 'filesystem',
			outputDir: '.lighthouseci/reports',
		},
	},
};
