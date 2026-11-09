import { beforeEach, describe, expect, it } from 'vitest';
import Contact from './Contact.astro';
import { type AstroContainer, createContainer, fixtureImage } from './test-fixtures';

describe('Contact', () => {
	let container: AstroContainer;
	beforeEach(async () => {
		container = await createContainer();
	});

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

	it('shows an avatar with its alt text after the heading when given one', async () => {
		const html = await container.renderToString(Contact, {
			props: { links, avatar: fixtureImage, avatarAlt: 'Portrait of Christiaan' },
		});
		expect(html).toMatch(/<\/h2>\s*<img[^>]*class="contact__avatar"/);
		expect(html).toMatch(/<img[^>]*alt="Portrait of Christiaan"/);
	});

	it('renders no avatar without one', async () => {
		const html = await container.renderToString(Contact, { props: { links } });
		expect(html).not.toContain('<img');
	});

	it('shows an entry without a target as plain text, not a link', async () => {
		const html = await container.renderToString(Contact, {
			props: { links: [...links, { label: 'LinkedIn · to be confirmed' }] },
		});
		expect(html).toMatch(/<li[^>]*>\s*<span class="contact__link contact__link--pending"[^>]*>LinkedIn · to be confirmed<\/span>/);
		expect(html).not.toMatch(/<a[^>]*>LinkedIn/);
	});

	it('marks a link to download, such as a CV, with the download attribute', async () => {
		const html = await container.renderToString(Contact, {
			props: { links: [{ label: 'CV (PDF)', href: 'cv.pdf', download: true }, links[0]] },
		});
		expect(html).toMatch(/<a[^>]*href="\/Portfolio\/cv.pdf"[^>]*download[^>]*>CV \(PDF\)<\/a>/);
		expect(html).not.toMatch(/<a[^>]*download[^>]*>GitHub<\/a>/);
	});
});
