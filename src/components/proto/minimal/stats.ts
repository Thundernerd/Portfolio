import type { CollectionEntry } from 'astro:content';
import { repoStats } from '../../../lib/github-stats';
import { escapeHtml, formatCount, noun } from './text';

type Project = CollectionEntry<'projects'>;

/**
 * Programming languages that can appear among a project's tags, with the colour GitHub uses for them.
 * The GitHub stats carry no language, so a project's language is derived from its tags: the first of
 * them found here (the tags also name engines and libraries). A language missing from this list is
 * not shown.
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
};

/** A project's language: the first of its tags that is a programming language, if any. */
function projectLanguage(project: Project): string | undefined {
	return project.data.tags.find((tag) => tag in LANGUAGE_COLOURS);
}

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
	for (const language of projects.map(projectLanguage)) {
		if (language) counts.set(language, (counts.get(language) ?? 0) + 1);
	}
	const sorted = [...counts].sort(
		([languageA, countA], [languageB, countB]) => countB - countA || languageA.localeCompare(languageB, 'en'),
	);
	const mostUsed = sorted[0]?.[1] ?? 1;
	return sorted.map(([language, count]) => ({ language, colour: LANGUAGE_COLOURS[language], count, share: count / mostUsed }));
}

/** The star count of all `projects` together, as resolved by `repoStats()` (unknown counts as 0). */
export function totalStars(projects: Project[]): number {
	return projects.reduce((sum, project) => sum + (repoStats(project.data).stars ?? 0), 0);
}

/**
 * The inline stats line for a project card's `extra` slot: its language (from its tags) and its star
 * count (from `repoStats()`), or `undefined` when it has neither.
 */
export function repoStatsHtml(project: Project): string | undefined {
	const language = projectLanguage(project);
	const { stars } = repoStats(project.data);
	const items: string[] = [];
	if (language) {
		items.push(
			`<li class="mn-stats__lang"><span class="mn-stats__dot" style="--lang-colour: ${LANGUAGE_COLOURS[language]}" aria-hidden="true"></span>${escapeHtml(language)}</li>`,
		);
	}
	if (stars !== undefined) {
		items.push(
			`<li class="mn-stats__stars"><data value="${stars}">${formatCount(stars)}</data> ${noun(stars, 'star', 'stars')}</li>`,
		);
	}
	return items.length > 0 ? `<ul class="mn-stats" aria-label="Repository stats">${items.join('')}</ul>` : undefined;
}
