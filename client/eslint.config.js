import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier';

export default defineConfig([
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      js,
      vue: pluginVue,
      '@typescript-eslint': tseslint.plugin,
      prettier,
    },
    // ✅ Do NOT use "plugin:vue/..." in flat config
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ],
    rules: {
      'vue/valid-v-for': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-template-shadow': 'warn',
      'vue/no-unused-vars': 'warn',
      'no-irregular-whitespace': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'prettier/prettier': ['error'],
    },
  },

  // ✅ Load official Flat Config for Vue here
  pluginVue.configs['flat/essential'],

  // Ensure Vue parser works
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
]);
