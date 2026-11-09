// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { stripHtmlComments } from './src/lib/strip-html-comments.ts';

// https://astro.build/config
export default defineConfig({
	// Served from GitHub Pages as a project site: https://thundernerd.github.io/Portfolio/
	site: 'https://thundernerd.github.io',
	base: '/Portfolio',
	trailingSlash: 'always',
	// `sitemap()` writes sitemap-index.xml from `site` + `base`; Base.astro links it.
	integrations: [mdx(), sitemap()],
	markdown: {
		// Keep the notes left in content bodies as HTML comments out of the built pages.
		processor: satteri({ mdastPlugins: [stripHtmlComments] }),
	},
});
