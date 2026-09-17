import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This rule flags the standard "fetch data in useEffect on
      // mount/param change" pattern (useLeads.js, useStats.js) as an error.
      // That's still the React docs' own recommended approach when you
      // aren't using a data-fetching library - see
      // https://react.dev/learn/you-might-not-need-an-effect#fetching-data
      // Downgraded to a warning rather than silenced entirely.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
