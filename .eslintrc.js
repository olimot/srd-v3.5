module.exports = {
  extends: ['airbnb-typescript', 'prettier', 'prettier/react', 'prettier/@typescript-eslint'],
  parserOptions: { project: './tsconfig.json' },
  env: { es2020: true, node: true, browser: true },
  rules: {
    'react/jsx-props-no-spreading': 0,
    'jsx-a11y/anchor-is-valid': 0,
  },
  overrides: [
    {
      files: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
      env: { mocha: true },
      rules: { 'func-names': 0, 'no-console': 0 },
    },
  ],
  overrides: [
    {
      files: ['src/workbench/**/*.ts', 'src/workbench/**/*.spec.tsx'],
      rules: {
        'func-names': 0,
        'no-console': 0,
        'import/no-extraneous-dependencies': 0,
        'no-param-reassign': 0,
        'no-continue': 0,
        'no-restricted-syntax': 0,
        'no-await-in-loop': 0,
        'max-classes-per-file': 0,
        'import/prefer-default-export': 0,
        'class-methods-use-this': 0,
      },
    },
  ],
};
