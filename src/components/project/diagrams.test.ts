import { describe, expect, it } from 'vitest';
import { projectDiagram } from './diagrams';
import GtrArchitecture from './GtrArchitecture.astro';

describe('projectDiagram', () => {
	it('gives Zeepkist GTR its architecture diagram', () => {
		expect(projectDiagram('zeepkist-gtr')).toBe(GtrArchitecture);
	});

	it('gives other projects no diagram', () => {
		expect(projectDiagram('zeepkist-rtm')).toBeUndefined();
		expect(projectDiagram('toString')).toBeUndefined();
	});
});
