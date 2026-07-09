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
  },
  {
    // The three/ folder is imperative 3D code: every frame we mutate
    // camera.position, mesh transforms, and progress refs in place. That's the
    // idiomatic Three.js / R3F pattern, so React 19's immutability rule (which
    // assumes React-style pure updates) doesn't apply here.
    files: ['src/three/**/*.{js,jsx}'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
])
