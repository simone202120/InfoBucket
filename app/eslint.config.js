// Flat config ESLint — richiesta da ESLint 9 (Expo SDK 54). Sostituisce il vecchio
// .eslintrc.js: estende il preset flat ufficiale di Expo. Stessa intenzione di prima
// (regole Expo + ignore di build), nel nuovo formato.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
];
