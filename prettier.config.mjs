import prettierConfigBase from '@unocha/hpc-repo-tools/prettier.config.base.js';

export default {
  ...prettierConfigBase,
  overrides: [
    ...prettierConfigBase.overrides,
    {
      files: ['.husky/*'],
      options: {
        parser: 'sh',
      },
    },
  ],
};
