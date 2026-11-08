import { hasTodo as isTodo } from '../../../content/todos';
import type { Entry } from './art';

/** The first plain-prose paragraph of a Markdown body that isn't a TODO, a comment, a heading or a list. */
function firstFinishedParagraph(body: string | undefined): string | undefined {
	return body
		?.split(/\r?\n\s*\r?\n/)
		.map((paragraph) => paragraph.trim().replace(/\s+/g, ' '))
		.find((paragraph) => paragraph !== '' && !isTodo(paragraph) && !/^(<!--|#|[-*+] |\d+\. |import |export )/.test(paragraph));
}

/**
 * The entry with its `TODO` placeholders softened for display: a TODO studio reads "To be announced"
 * and a TODO blurb gives way to the first finished paragraph of the body (or a generic line).
 * Prototype-only polish; the launch guard in `src/content/no-todos.test.ts` still tracks the gaps.
 */
export function softenTodos<T extends Entry>(entry: T): T {
	const data: Record<string, unknown> = { ...entry.data };
	if (typeof data.studio === 'string' && isTodo(data.studio)) data.studio = 'To be announced';
	if (isTodo(entry.data.blurb)) data.blurb = firstFinishedParagraph(entry.body) ?? 'More about this one soon.';
	return { ...entry, data } as T;
}
