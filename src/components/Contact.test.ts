import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Contact from './Contact.astro';

describe('Contact', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		vi.stubEnv('BASE_URL', '/Portfolio/');
		container = await AstroContainer.create();
	});
	afterEach(() => vi.unstubAllEnvs());

	const links = [
		{ label: 'GitHub', href: 'https://github.com/Thundernerd' },
		{ label: 'Email', href: 'mailto:hello@example.com' },
		{ label: 'CV (PDF)', href: 'cv.pdf' },
	];

	it('renders a "Contact" section labelled by its heading by default', async () => {
		const html = await container.renderToString(Contact, { props: { links } });
		expect(html).toMatch(/<section[^>]*id="contact"[^>]*aria-labelledby="contact-heading"/);
		expect(html).toMatch(/<h2[^>]*id="contact-heading"[^>]*>Contact<\/h2>/);
	});

	it('accepts a custom id and title', async () => {
		const html = await container.renderToString(Contact, { props: { links, id: 'about', title: 'About me' } });
		expect(html).toMatch(/<h2[^>]*id="about-heading"[^>]*>About me<\/h2>/);
	});

	it('lists the links inside an address, base-prefixing site paths', async () => {
		const html = await container.renderToString(Contact, { props: { links } });
		expect(html).toMatch(/<address[^>]*>\s*<ul/);
		expect(html).toMatch(/<a[^>]*href="https:\/\/github.com\/Thundernerd"[^>]*>GitHub<\/a>/);
		expect(html).toMatch(/<a[^>]*href="mailto:hello@example.com"[^>]*>Email<\/a>/);
		expect(html).toMatch(/<a[^>]*href="\/Portfolio\/cv.pdf"[^>]*>CV \(PDF\)<\/a>/);
	});

	it('renders slotted copy before the links', async () => {
		const html = await container.renderToString(Contact, {
			props: { links },
			slots: { default: '<p>Say hi.</p>' },
		});
		expect(html).toMatch(/<p>Say hi.<\/p>.*<address/s);
	});
});
