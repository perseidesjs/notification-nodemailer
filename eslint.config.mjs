import { config as defaultConfig } from '@epic-web/config/eslint'

/**
 * @type {import("eslint").Linter.Config}
 * @description ESLint configuration that ignores .medusa/ folder and focuses on src/
 */
export default [
	{
		ignores: ['.medusa/**'],
	},
	...defaultConfig,
]
