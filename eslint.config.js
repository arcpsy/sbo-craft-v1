// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config([
  globalIgnores(['dist']),

  // Base + plugin recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.vite,
  jsxA11y.configs.recommended,
  prettierPlugin.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'prettier/prettier': 'error', // Prettier issues = ESLint errors

      // 🔒 React Refresh specific
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // 🧹 TypeScript cleanup
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
]);
