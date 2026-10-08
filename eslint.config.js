'use strict'

const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['node_modules/', 'coverage/', 'docs/annotated/', '.nyc_output/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      // Framework callbacks such as (req, res, next) and plugin
      // definitions such as function plugin(options) often leave
      // arguments unused on purpose.
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
]
