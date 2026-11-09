import { beforeEach, describe, expect, it } from 'vitest';
import Hero from './Hero.astro';
import { type AstroContainer, createContainer } from './test-fixtures';

describe('Hero', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

	it('renders the title as the page heading with the tagline', async () => {
		const html = await container.renderToString(Hero, {
			props: { title: 'Christiaan Bloemendaal', tagline: 'Game & tools programmer' },
		});
		expect(html).toMatch(/<h1[^>]*>Christiaan Bloemendaal<\/h1>/);
		expect(html).toContain('Game &amp; tools programmer');
	});

	it('renders a section rather than a banner landmark, leaving the site header to the layout', async () => {
		const html = await container.renderToString(Hero, { props: { title: 'Name' } });
		expect(html).toMatch(/^<section[^>]*class="hero"/);
		expect(html).not.toContain('<header');
	});

	it('renders actions as links, base-prefixing site paths', async () => {
		const html = await container.renderToString(Hero, {
			props: {
				title: 'Name',
				actions: [
					{ label: 'Games', href: '#games' },
					{ label: 'CV', href: 'cv.pdf' },
					{ label: 'GitHub', href: 'https://github.com/Thundernerd' },
				],
			},
		});
		expect(html).toMatch(/<a[^>]*href="#games"[^>]*>Games<\/a>/);
		expect(html).toMatch(/<a[^>]*href="\/Portfolio\/cv.pdf"[^>]*>CV<\/a>/);
		expect(html).toMatch(/<a[^>]*href="https:\/\/github.com\/Thundernerd"[^>]*>GitHub<\/a>/);
	});

	it('marks only the primary action with the primary modifier', async () => {
		const html = await container.renderToString(Hero, {
			props: {
				title: 'Name',
				actions: [
					{ label: 'Games', href: '#games', primary: true },
					{ label: 'CV', href: 'cv.pdf' },
				],
			},
		});
		expect(html).toMatch(/<a[^>]*class="(?=[^"]*\bhero__action\b)[^"]*\bhero__action--primary\b[^"]*"[^>]*>Games<\/a>/);
		expect(html).toMatch(/<a[^>]*class="hero__action"[^>]*>CV<\/a>/);
	});

	it('omits the actions list when there are none', async () => {
		const html = await container.renderToString(Hero, { props: { title: 'Name' } });
		expect(html).not.toContain('<ul');
	});

	it('renders slotted media inside the hero', async () => {
		const html = await container.renderToString(Hero, {
			props: { title: 'Name' },
			slots: { media: '<canvas id="hero-canvas"></canvas>' },
		});
		expect(html).toContain('<canvas id="hero-canvas"></canvas>');
	});
});
