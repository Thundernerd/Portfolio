import { describe, expect, it } from 'vitest';
import { fixtureImage, gameEntry, projectEntry } from '../../test-fixtures';
import { cardMedia, embedUrl, youTubeId } from './media';

describe('youTubeId', () => {
	it.each([
		['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
		['https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
		['https://youtu.be/dQw4w9WgXcQ?t=10', 'dQw4w9WgXcQ'],
		['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
		['https://m.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
	])('reads the video id from %s', (url, id) => {
		expect(youTubeId(url)).toBe(id);
	});

	it.each(['https://vimeo.com/123456', 'https://www.youtube.com/@Thundernerd', 'https://evil.example/watch?v=dQw4w9WgXcQ'])(
		'has no id for %s',
		(url) => {
			expect(youTubeId(url)).toBeUndefined();
		},
	);
});

describe('embedUrl', () => {
	it('embeds the video privacy-enhanced, autoplaying once clicked', () => {
		expect(embedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
	});
});

describe('cardMedia', () => {
	it('turns a YouTube trailer into a click-to-play poster without loading YouTube', () => {
		const html = cardMedia(gameEntry({ title: 'Good Job!', trailer: 'https://youtu.be/dQw4w9WgXcQ' }))!;
		expect(html).toMatch(/<button[^>]*type="button"[^>]*data-youtube-id="dQw4w9WgXcQ"/);
		expect(html).toContain('aria-label="Play the Good Job! trailer"');
		expect(html).toContain('data-trailer-title="Good Job! trailer"');
		expect(html).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
		expect(html).toContain('loading="lazy"');
		expect(html).not.toContain('<iframe');
	});

	it('uses the cover as the trailer poster when there is one', () => {
		const html = cardMedia(gameEntry({ trailer: 'https://youtu.be/dQw4w9WgXcQ', cover: fixtureImage }))!;
		expect(html).toContain('src="/fixtures/cover.png"');
		expect(html).not.toContain('i.ytimg.com');
	});

	it('leaves a game with a cover and no trailer to the card’s own cover', () => {
		expect(cardMedia(gameEntry({ cover: fixtureImage }))).toBeUndefined();
	});

	it('shows a generated initials tile when there is no art at all', () => {
		const html = cardMedia(gameEntry({ title: 'Nailed It! Baking Bash' }, 'nailed-it-baking-bash'))!;
		expect(html).toMatch(/<div class="dark-tile"[^>]*aria-hidden="true"/);
		expect(html).toMatch(/>NB</);
		expect(html).toMatch(/style="--tile-hue: \d+"/);
	});

	it('keeps a short single-word title whole on its tile', () => {
		expect(cardMedia(gameEntry({ title: 'FRU' }, 'fru'))).toMatch(/>FRU</);
	});

	it('gives each entry a stable hue of its own', () => {
		const hue = (id: string) => cardMedia(projectEntry({}, id))!.match(/--tile-hue: (\d+)/)![1];
		expect(hue('zeepsdk')).toBe(hue('zeepsdk'));
		expect(hue('zeepsdk')).not.toBe(hue('zeepkist-gtr'));
	});

	it('escapes titles in markup', () => {
		const html = cardMedia(gameEntry({ title: 'A "<b>" & Co', trailer: 'https://youtu.be/dQw4w9WgXcQ' }))!;
		expect(html).toContain('Play the A &quot;&lt;b&gt;&quot; &amp; Co trailer');
	});

	it('ignores a non-YouTube trailer link, so the card keeps its link to it', () => {
		expect(cardMedia(gameEntry({ title: 'FRU', trailer: 'https://vimeo.com/1' }, 'fru'))).toContain('dark-tile');
	});
});
