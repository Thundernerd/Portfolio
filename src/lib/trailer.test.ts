import { describe, expect, it } from 'vitest';
import { trailerEmbedUrl } from './trailer';

describe('trailerEmbedUrl', () => {
	it.each([
		['a watch link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
		['a watch link with more parameters', 'https://youtube.com/watch?t=42&v=dQw4w9WgXcQ&list=PL1'],
		['a mobile link', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ'],
		['a short link', 'https://youtu.be/dQw4w9WgXcQ?si=share'],
		['an embed link', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
		['a privacy-enhanced embed link', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
	])('embeds YouTube %s without tracking cookies', (_, url) => {
		expect(trailerEmbedUrl(url)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
	});

	it.each([
		['a video on another site', 'https://vimeo.com/123456'],
		['a YouTube channel', 'https://www.youtube.com/@Thundernerd'],
		['a watch link without a video', 'https://www.youtube.com/watch?list=PL1'],
		['a look-alike host', 'https://notyoutube.com/watch?v=dQw4w9WgXcQ'],
		['a malformed video id', 'https://youtu.be/abc"onload="x'],
	])('has no embed for %s', (_, url) => {
		expect(trailerEmbedUrl(url)).toBeUndefined();
	});
});
