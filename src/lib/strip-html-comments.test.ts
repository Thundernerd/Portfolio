import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { stripHtmlComments } from './strip-html-comments';

const render = (markdown: string) => markdownToHtml(markdown, { mdastPlugins: [stripHtmlComments] }).html;

describe('stripHtmlComments', () => {
	it('drops HTML comments, such as the TODO notes in content bodies, from the rendered page', () => {
		const html = render(
			'<!-- TODO(Christiaan): a private note. -->\n\nZeepSDK is an SDK.\n\n<!--\nA comment\nover lines.\n-->\n\n- One <!-- inline --> item\n',
		);
		expect(html).not.toContain('<!--');
		expect(html).not.toContain('TODO');
		expect(html).toContain('<p>ZeepSDK is an SDK.</p>');
		expect(html).toMatch(/<li>One\s+item<\/li>/);
	});

	it('keeps other raw HTML', () => {
		expect(render('<details><summary>More</summary>\n\nHidden.\n\n</details>\n\nA <kbd>key</kbd>.')).toMatch(
			/<details><summary>More<\/summary>[\s\S]*<kbd>key<\/kbd>/,
		);
	});
});
