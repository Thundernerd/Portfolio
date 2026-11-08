import { describe, expect, it } from 'vitest';
import { loadProjects } from './test-entries';

const projects = loadProjects();

describe('Zeepkist mods collection', () => {
	it('lists the expected mods, each once', () => {
		const repos = projects
			.filter((project) => project.kind === 'zeepkist-mod')
			.map((project) => project.repo)
			.sort();
		expect(repos).toEqual(
			[
				'Thundernerd/Zeepkist.RTM',
				'Thundernerd/Zeepkist.MedalTimes',
				'Thundernerd/Zeepkist.FavoriteBlocks',
				'Thundernerd/Zeepkist.ObjectProperties',
				'Thundernerd/Zeepkist.LogicScripting',
				'Thundernerd/Zeepkist.Tester',
				'Thundernerd/Zeepkist.VertexSnapper',
				'donderjoekel/Zeepkist.LevelEditorTrails',
				'Thundernerd/Zeepkist-WASD',
				'donderjoekel/Zeepkist.WorkshopApi',
				'donderjoekel/Zeepkist.Templates',
				'Thundernerd/Zeepkist.GameLibs',
				'Thundernerd/Zeepkist-Utilities',
				'Thundernerd/Zeepkist-Events',
				'Thundernerd/Zeepkist-LevelEditorMovementSpeed',
			].sort(),
		);
	});
});
