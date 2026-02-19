import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-console': 'off',
      'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      'max-classes-per-file': 'off',
      'import/prefer-default-export': 'off',
    },
  },
];