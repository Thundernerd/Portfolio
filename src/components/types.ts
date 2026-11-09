/** A labelled link passed to a section component. */
export interface Link {
	label: string;
	/** A site path (resolved with `withBase()`), an absolute URL, or an in-page `#fragment`. */
	href: string;
}

/** A hero call to action; `primary` marks the main one with `.hero__action--primary`. */
export interface HeroAction extends Link {
	primary?: boolean;
}
