const baseConfig = require('@unocha/hpc-repo-tools/eslintrc.base');

module.exports = {
  ...baseConfig,
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  overrides: [
    ...baseConfig.overrides,
    {
      files: ['*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        'unicorn/prefer-module': 'off',
      },
    },
  ],
};
