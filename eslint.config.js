const baseConfig = require('@unocha/hpc-repo-tools/eslint.config.base');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'unicorn/prefer-module': 'off',
    },
  },
  {
    ignores: ['.github', '.prettierrc.js', 'eslint.config.js'],
  },
];
