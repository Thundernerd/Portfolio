// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// Served from GitHub Pages as a project site: https://thundernerd.github.io/Portfolio/
	site: 'https://thundernerd.github.io',
	base: '/Portfolio',
	trailingSlash: 'always',
	// `sitemap()` writes sitemap-index.xml from `site` + `base`; Base.astro links it.
	integrations: [mdx(), sitemap()],
});
