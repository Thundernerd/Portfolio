/** Small text helpers shared by the home page's components. */

/** Escapes text for HTML built as a string (the cards' `media`/`extra` slots take trusted HTML). */
export const escapeHtml = (text: string) =>
	text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** `count` with thousands separators, as the shared cards format star counts. */
export const formatCount = (count: number) => count.toLocaleString('en-US');

/** The singular or plural noun for `count`. */
export const noun = (count: number, one: string, many: string) => (count === 1 ? one : many);

/** `count` and its noun, e.g. "1,234 stars". */
export const plural = (count: number, one: string, many: string) => `${formatCount(count)} ${noun(count, one, many)}`;
