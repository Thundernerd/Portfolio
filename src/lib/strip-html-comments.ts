import { defineMdastPlugin } from 'satteri';

/** An HTML node that holds nothing but comments (and the whitespace around them). */
const onlyComments = /^\s*(?:<!--[\s\S]*?-->\s*)+$/;

/**
 * Sätteri Markdown plugin that drops HTML comments from content bodies, so notes left in an entry
 * (such as its `TODO(Christiaan): …` reminders) never reach the built page's source. Other raw
 * HTML is kept. Registered with the Markdown processor in `astro.config.mjs`.
 */
export const stripHtmlComments = defineMdastPlugin({
	name: 'strip-html-comments',
	html(node, ctx) {
		if (onlyComments.test(node.value)) ctx.removeNode(node);
	},
});
