import { UserConfig } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(commit) => commit === ''],
  defaultIgnores: true,
  helpUrl:
    'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};

module.exports = Configuration;
