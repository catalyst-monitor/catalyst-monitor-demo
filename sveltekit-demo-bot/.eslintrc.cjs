module.exports = {
  root: true,
  env: { es2020: true, node: true },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
}
