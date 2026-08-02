import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

/**
 * Shared ESLint flat config for all Jetronticket packages.
 * @type {import('eslint').Linter.Config[]}
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Turn off rules that conflict with Prettier. Keep this last.
  eslintConfigPrettier,
)
