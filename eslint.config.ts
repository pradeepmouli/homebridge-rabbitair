
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['node_modules/**', 'dist/**', 'build/**', 'test/**', 'coverage/**', 'src/**/*.js']
	},
	{
		rules: {
			quotes: ['warn', 'single'],
			indent: ['warn', 'tab', { SwitchCase: 1 }],
			'no-tabs': 'off',
			'no-mixed-spaces-and-tabs': 'off',
			'linebreak-style': ['error', 'unix'],
			semi: ['error', 'always'],
			'comma-dangle': ['error'],
			'dot-notation': 'error',
			eqeqeq: ['error', 'smart'],
			curly: ['error', 'all'],
			'brace-style': ['error'],
			'prefer-arrow-callback': 'warn',
			'max-len': ['warn', 160],
			'object-curly-spacing': ['error', 'always'],
			'no-use-before-define': 'off',
			'@typescript-eslint/no-use-before-define': [
				'error',
				{ classes: false, enums: false }
			],
			'@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }]
		}
	},
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module'
		}
	},
	...tseslint.configs.recommended
);
