// Flat config (the format ESLint 9 and eslint-config-expo use from SDK 53 on).
//
// The point of this file is not style — Prettier owns that — it is the rules
// that catch the class of thing a full-tree audit had to find by hand: imports
// and variables nothing reads, and files that drift out of use without anyone
// noticing. Those now fail the `lint` script, so they surface on the change
// that introduces them.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      'dist/*',
      'ios/*',
      'android/*',
      '.expo/*',
      // Generated from the Supabase schema — not hand-edited, so lint findings
      // here are noise that cannot be actioned without regenerating.
      'src/types/database.ts',
      // Deno, not Node: it imports via `npm:` specifiers and runs on Supabase's
      // edge runtime, so Node module resolution and globals both mis-report
      // here. Deno has its own check (`deno lint`/`deno check`).
      'supabase/functions/**',
    ],
  },
  {
    // Shared rules that need no plugin, so they can apply everywhere.
    rules: {
      'no-unreachable': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
  {
    // eslint-config-expo registers @typescript-eslint only for TS files, so the
    // rule has to be scoped to match — applying it repo-wide fails to resolve
    // the plugin on the plain-JS scripts.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Unused code is the thing this repo actually accumulates. Error, not
      // warn: a warning in CI is a warning nobody reads.
      'no-unused-vars': 'off', // superseded by the TS-aware rule below
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // A leading underscore is the opt-out, for genuinely-unused bindings
          // that have to stay for positional reasons.
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Node scripts, not app code: they legitimately use console and the Node
    // globals, none of which the Expo (react-native) environment declares.
    files: ['scripts/**/*.{ts,mjs,js}'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Runs inside Figma's plugin sandbox (via the design MCP), not Node, so
    // `figma` is the host-injected global and there is no import to declare.
    files: ['scripts/*.fig.js'],
    languageOptions: {
      globals: { figma: 'readonly' },
    },
  },
  {
    // The React Compiler rules that ship with eslint-config-expo flag 84 places
    // in this codebase — overwhelmingly ref access inside the hand-written
    // animation code, which predates these rules and is not obviously wrong.
    //
    // They are warnings rather than errors on purpose: turning them off loses
    // the signal, and erroring means CI is red on day one and the whole gate
    // gets ignored. Warnings keep them visible and let `lint` still guard the
    // things that are unambiguous. Burn the count down and promote to error.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]);
