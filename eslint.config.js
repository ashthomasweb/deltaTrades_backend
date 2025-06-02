import { defineConfig } from 'eslint/config'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  {
    // ignores: ["src/storedData/*"]
  },
  {
    files: ['src/websocket/server.test.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
  {
    extends: compat.extends('eslint:recommended', 'plugin:prettier/recommended'),

    files: ['**/*.ts'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },

      parser: tsParser,
    },

    rules: {
      semi: ['error', 'never'],
      // "indent": ['error', 2],
      'no-unused-vars': ['off'],
      'no-case-declarations': ['warn'],
      'no-fallthrough': ['warn'],
      'no-undef': ['warn'],
      'max-len': ['warn', 120],

      'prettier/prettier': [
        'error',
        {
          semi: false,
          tabWidth: 2,
          singleQuote: true,
          endOfLine: 'auto',
          printWidth: 120,
        },
      ],
    },
  },
])
