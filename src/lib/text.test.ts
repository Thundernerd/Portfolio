import { describe, expect, it } from 'vitest';
import { escapeHtml, formatCount, noun, plural } from './text';

describe('escapeHtml', () => {
	it('escapes the characters that are special in HTML text and attributes', () => {
		expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
	});

	it('leaves plain text alone', () => {
		expect(escapeHtml('Zeepkist mods')).toBe('Zeepkist mods');
	});
});

describe('formatCount', () => {
	it('groups thousands with commas', () => {
		expect(formatCount(1234567)).toBe('1,234,567');
	});

	it('leaves small counts as they are', () => {
		expect(formatCount(0)).toBe('0');
		expect(formatCount(999)).toBe('999');
	});
});

describe('noun', () => {
	it('is singular for exactly one', () => {
		expect(noun(1, 'star', 'stars')).toBe('star');
	});

	it('is plural for zero and for more than one', () => {
		expect(noun(0, 'star', 'stars')).toBe('stars');
		expect(noun(2, 'star', 'stars')).toBe('stars');
	});
});

describe('plural', () => {
	it('joins the formatted count and its noun', () => {
		expect(plural(1, 'star', 'stars')).toBe('1 star');
		expect(plural(1234, 'star', 'stars')).toBe('1,234 stars');
	});
});
