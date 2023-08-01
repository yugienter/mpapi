module.exports = {
  root: true,
  plugins: [
    'simple-import-sort',
    '@typescript-eslint',
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    semi: ['error', 'never'],
    curly: 'error',
    'no-unused-labels': 'warn',
    'no-unused-vars': 'off',
    'no-constant-condition': 'warn',
    'simple-import-sort/imports': [
      'warn',
      {
        groups: [
          // デフォルト: 副作用インポート
          ['^\\u0000'],
          // パッケージ: ただし @test/ は除外
          ['^(?:\\w|@(?!.*test/)\\w)'],
          // 絶対インポート
          ['^@/'],
          ['^@tests/'],
          // デフォルト: 他にマッチしなかったもの
          ['^'],
          // デフォルト: 相対インポート
          ['^\\.'],
        ]
      }
    ],
    indent: [
      'warn',
      2,
      {
        ignoredNodes: [
          'TemplateLiteral',
          'ConditionalExpression',
          'SwitchCase',
          'MemberExpression',
        ],
      },
    ],
    'no-template-curly-in-string': 'warn',
    'no-var': 'error',
    'prefer-const': 'warn',
    'max-len': ['warn', { code: 140 }],
    'max-depth': ['warn', 3],
    'comma-spacing': ['warn', { before: false, after: true }],
    'no-sequences': 'error',
    complexity: ['warn', 20],
    'block-spacing': 'warn',
    'no-whitespace-before-property': 'warn',
    'space-infix-ops': 'warn',
    'no-empty-function': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/'],
  settings: {},
}
