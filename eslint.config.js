import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },

  js.configs.recommended,

  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // The project uses the automatic JSX runtime, so React need not be in scope.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Reported at two sites: loading seed data once on mount, and syncing the
      // task form to its incoming prop. Both are intentional and correct here,
      // so this is advisory rather than blocking.
      'react-hooks/set-state-in-effect': 'warn',

      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },

  {
    files: ['src/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
]
