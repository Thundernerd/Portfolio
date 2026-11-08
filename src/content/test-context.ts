import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';

/** Astro's image() helper resolves files at build time; outside Astro, stand in a plain path. */
export const testSchemaContext = { image: () => z.string() } as unknown as SchemaContext;
