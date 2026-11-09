// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { stripHtmlComments } from './src/lib/strip-html-comments.ts';

// https://astro.build/config
export default defineConfig({
	// Served from GitHub Pages as a project site: https://thundernerd.github.io/Portfolio/
	site: 'https://thundernerd.github.io',
	base: '/Portfolio',
	integrations: [mdx()],
	markdown: {
		// Keep the notes left in content bodies as HTML comments out of the built pages.
		processor: satteri({ mdastPlugins: [stripHtmlComments] }),
	},
});
