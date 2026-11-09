import type { CollectionEntry } from 'astro:content';
import { repoStats } from '../../lib/github-stats';
import { escapeHtml, formatCount, noun } from './text';

type Project = CollectionEntry<'projects'>;

/**
 * The colour GitHub uses for each language the home page expects to show: every language in
 * `TAG_LANGUAGES` (`src/lib/github-stats.ts`), plus ones GitHub reports for the current repos. Any
 * other language gets `OTHER_LANGUAGE_COLOUR`.
 */
const LANGUAGE_COLOURS: Record<string, string> = {
	'C#': '#178600',
	'C++': '#f34b7d',
	Rust: '#dea584',
	TypeScript: '#3178c6',
	JavaScript: '#f1e05a',
	Python: '#3572a5',
	Lua: '#000080',
	Go: '#00add8',
	Batchfile: '#c1f12e',
	Shell: '#89e051',
	HTML: '#e34c26',
};
const OTHER_LANGUAGE_COLOUR = '#8b949e';

const colourOf = (language: string) => LANGUAGE_COLOURS[language] ?? OTHER_LANGUAGE_COLOUR;

/** One language in the hero's breakdown. */
export interface LanguageShare {
	language: string;
	colour: string;
	/** How many of the projects use it. */
	count: number;
	/** `count` relative to the most used language (0-1], for drawing bars. */
	share: number;
}

/** How many of `projects` use each language, most used first (ties by name). */
export function languageBreakdown(projects: Project[]): LanguageShare[] {
	const counts = new Map<string, number>();
	for (const language of projects.map((project) => repoStats(project.data).language)) {
		if (language) counts.set(language, (counts.get(language) ?? 0) + 1);
	}
	const sorted = [...counts].sort(
		([languageA, countA], [languageB, countB]) => countB - countA || languageA.localeCompare(languageB, 'en'),
	);
	const mostUsed = sorted[0]?.[1] ?? 1;
	return sorted.map(([language, count]) => ({ language, colour: colourOf(language), count, share: count / mostUsed }));
}

/** The star count of all `projects` together, as resolved by `repoStats()` (unknown counts as 0). */
export function totalStars(projects: Project[]): number {
	return projects.reduce((sum, project) => sum + (repoStats(project.data).stars ?? 0), 0);
}

/**
 * The inline stats line for a project card's `extra` slot: its language and star count (both from
 * `repoStats()`), or `undefined` when it has neither.
 */
export function repoStatsHtml(project: Project): string | undefined {
	const { language, stars } = repoStats(project.data);
	const items: string[] = [];
	if (language) {
		items.push(
			`<li class="site-stats__lang"><span class="site-stats__dot" style="--lang-colour: ${colourOf(language)}" aria-hidden="true"></span>${escapeHtml(language)}</li>`,
		);
	}
	if (stars !== undefined) {
		items.push(
			`<li class="site-stats__stars"><data value="${stars}">${formatCount(stars)}</data> ${noun(stars, 'star', 'stars')}</li>`,
		);
	}
	return items.length > 0 ? `<ul class="site-stats" aria-label="Repository stats">${items.join('')}</ul>` : undefined;
}
