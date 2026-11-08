import type { CollectionEntry } from 'astro:content';
import { repoStats } from '../../../lib/github-stats';

/**
 * Programming languages that can appear among a project's tags, with the colour GitHub uses for them.
 * A project's language is the first of its tags found here (the tags also name engines and libraries).
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
export function projectLanguage(project: CollectionEntry<'projects'>): string | undefined {
	return project.data.tags.find((tag) => tag in LANGUAGE_COLOURS);
}

/** The colour GitHub uses for `language`. */
export const languageColour = (language: string) => LANGUAGE_COLOURS[language];

const escapeHtml = (text: string) =>
	text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * The inline stats line for a project card's `extra` slot: its language (from its tags) and its star
 * count (from `repoStats()`), or `undefined` when it has neither.
 */
export function repoStatsHtml(project: CollectionEntry<'projects'>): string | undefined {
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
			`<li class="mn-stats__stars"><data value="${stars}">${stars.toLocaleString('en-US')}</data> ${stars === 1 ? 'star' : 'stars'}</li>`,
		);
	}
	return items.length > 0 ? `<ul class="mn-stats" aria-label="Repository stats">${items.join('')}</ul>` : undefined;
}
