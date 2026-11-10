import { z } from 'astro/zod';
import type { ImageMetadata } from 'astro';
import type { SchemaContext } from 'astro:content';

/** An absolute http(s) link; other schemes (mailto:, javascript:) can't be embedded or linked safely. */
const webUrl = () => z.url({ protocol: /^https?$/ });

/**
 * Frontmatter of a released game in `src/content/games/`. The MD/MDX body holds "what I did" (my
 * responsibilities), shown on the game's page.
 */
export const gameSchema = ({ image }: SchemaContext) =>
	z.object({
		title: z.string(),
		platforms: z.array(z.string()).nonempty(),
		role: z.string(),
		studio: z.string(),
		// The year, media and links are optional so entries can land before they're confirmed.
		year: z.number().int().optional(),
		cover: image().optional(),
		trailer: webUrl().optional(),
		storeLinks: z.array(z.object({ label: z.string(), url: webUrl() })).default([]),
		blurb: z.string(),
		// The engines, languages and services I worked with on it.
		tech: z.array(z.string()).default([]),
		// The game page's gallery; the alt text describes what each shot shows.
		screenshots: z.array(z.object({ image: image(), alt: z.string() })).default([]),
		// The game soft-launched but was pulled before a full release: it gets a "Soft launch"
		// label and doesn't count towards the home page's released games.
		softLaunchOnly: z.boolean().default(false),
	});

/**
 * The kinds of project, one per home-page section that lists projects. A kind with no section would
 * leave its entries off the page, so add the section with the kind (`Home.test.ts` checks this).
 */
export const projectKinds = ['featured', 'zeepkist-mod', 'unity-plugin', 'tool'] as const;

/** The folder under `src/content/projects/` that holds each kind's entries (`projects.test.ts` checks this). */
export const projectKindFolders: Record<(typeof projectKinds)[number], string> = {
	featured: 'featured',
	'zeepkist-mod': 'mods',
	'unity-plugin': 'plugins',
	tool: 'tools',
};

/** Frontmatter of a project in `src/content/projects/`: featured work and the mod/plugin collections. */
export const projectSchema = ({ image }: SchemaContext) =>
	z.object({
		title: z.string(),
		// GitHub `owner/name`; the owner varies (Thundernerd, donderjoekel).
		repo: z.string().regex(/^[A-Za-z0-9-]+\/(?!\.\.?$)[\w.-]+$/, 'Expected a GitHub repo as owner/name'),
		kind: z.enum(projectKinds),
		tags: z.array(z.string()).default([]),
		// Also the project page's link-preview image, which is converted to PNG/JPEG for crawlers. The
		// build won't rasterize an SVG (Astro's `image.dangerouslyProcessSVG` stays off), so export a
		// PNG instead. Under Vitest `image()` is a plain path, so both shapes are checked.
		image: image()
			.refine((img: ImageMetadata | string) => (typeof img === 'string' ? !/\.svg$/i.test(img) : img.format !== 'svg'), {
				message: 'A project image cannot be an SVG: link previews need a raster image, so export it as a PNG',
			})
			.optional(),
		blurb: z.string(),
		// Fallback star count; a later build-time fetcher may refresh it from GitHub.
		stars: z.number().int().nonnegative().optional(),
		// The GitHub repo is archived (read-only); cards label it so visitors know it's unmaintained.
		// The build prefers GitHub's own flag (see `repoStats()`); this is the fallback when it can't fetch it.
		archived: z.boolean().default(false),
	});
