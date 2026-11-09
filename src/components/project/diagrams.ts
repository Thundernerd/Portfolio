import GtrArchitecture from './GtrArchitecture.astro';

/**
 * The diagrams drawn on a featured project's page (`src/pages/projects/[slug].astro`), by the
 * project's entry id. A diagram is a component that takes no props.
 */
type DiagramComponent = typeof GtrArchitecture;

const diagrams: Readonly<Record<string, DiagramComponent>> = {
	'zeepkist-gtr': GtrArchitecture,
};

/** The diagram for the project with this entry id, or `undefined` when it has none. */
export const projectDiagram = (id: string) => (Object.hasOwn(diagrams, id) ? diagrams[id] : undefined);
