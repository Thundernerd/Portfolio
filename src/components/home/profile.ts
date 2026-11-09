import avatar from '../../assets/avatar.jpg';
import type { ImageMetadata } from 'astro';
import type { ContactLink } from '../types';

/** The facts in the home page's about & contact section. */
export interface Profile {
	avatar: ImageMetadata;
	avatarAlt: string;
	links: ContactLink[];
}

/**
 * The facts the home page's about & contact section shows: the avatar and the contact links, in
 * order. A link whose `href` is still a to-do placeholder shows as a quiet "to be confirmed" entry,
 * and the launch guard (`CHECK_TODOS=1 npm test`, see "Content TODOs" in README.md) lists it until
 * it is filled in. Site paths (a CV under `public/`) go through `withBase()`.
 */
export const profile: Profile = {
	avatar,
	avatarAlt: 'Portrait of Christiaan',
	links: [
		{ label: 'GitHub · Thundernerd', href: 'https://github.com/Thundernerd' },
		{ label: 'GitHub · donderjoekel', href: 'https://github.com/donderjoekel' },
		{ label: 'LinkedIn', href: 'TODO: LinkedIn profile URL' },
		{ label: 'Email', href: 'TODO: mailto: link to a public email address' },
		{ label: 'CV (PDF)', href: 'TODO: put the CV in public/ and give its path, e.g. cv.pdf', download: true },
	],
};
