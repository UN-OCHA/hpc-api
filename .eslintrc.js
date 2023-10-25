const baseConfig = require('@unocha/hpc-repo-tools/eslintrc.base');

module.exports = {
  ...baseConfig,
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
};
