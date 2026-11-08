/** A labelled link passed to a section component. */
export interface Link {
	label: string;
	/** A site path (resolved with `withBase()`), an absolute URL, or an in-page `#fragment`. */
	href: string;
}
