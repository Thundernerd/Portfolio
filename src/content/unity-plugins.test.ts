import { describe, expect, it } from 'vitest';
import { loadProjects } from './test-entries';

const unityPluginRepos = loadProjects()
	.filter((project) => project.kind === 'unity-plugin')
	.map((project) => project.repo);

describe('Unity plugins collection', () => {
	it.each([
		'Thundernerd/Unity3D-SerializableInterface',
		'Thundernerd/Unity3D-ExtendedEvent',
		'Thundernerd/Unity3D-NSubstitute',
		'Thundernerd/Unity3D-IconManager',
		'Thundernerd/Unity3D-AutoHook',
		'Thundernerd/Unity3D-ExecutionOrderAttribute',
		'Thundernerd/Unity3D-ExtendedEditor',
		'Thundernerd/Unity3D-ComponentAttribute',
		'Thundernerd/Unity3D-Humanizr',
		// The other Unity3D-* repos with at least 10 stars.
		'Thundernerd/Unity3D-LayersTagsGenerator',
		'Thundernerd/Unity3D-CodeGenerator',
		'Thundernerd/Unity3D-Reflectives',
		'Thundernerd/Unity3D-Histogrammer',
		'Thundernerd/Unity3D-ConstrainedRect',
		'Thundernerd/Unity3D-StateMachine',
		'Thundernerd/Unity3D-ScriptingDefineUtility',
		'Thundernerd/Unity3D-EnumAsIndex',
		'Thundernerd/Unity3D-Automatron',
		'Thundernerd/Unity3D-Extensions',
		'Thundernerd/Unity3D-PackageManagerModules',
		'Thundernerd/Unity3D-ResourceAttribute',
	])('has an entry for %s', (repo) => {
		expect(unityPluginRepos).toContain(repo);
	});
});
