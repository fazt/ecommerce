import nextPlugin from 'eslint-config-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

/** ESLint 9 flat config. */
export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'next-env.d.ts',
      'prisma/migrations/**',
      'coverage/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Plan rule 11: no 'use server' directives anywhere in src/app.
          selector: "Program[body>/DirectiveLiteral[value='use server']]",
          message: "Server Actions are disabled in this project. Use a Route Handler under src/app/api/**/route.ts instead.",
        },
        {
          selector: "ImportSpecifier[imported.name='useFormState'], ImportSpecifier[imported.name='useFormStatus']",
          message: 'These React APIs are Server Action companions. Use Route Handlers + native forms.',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];