import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import { includeIgnoreFile } from "@eslint/compat";
import globals from "globals";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

const isProduction = process.env.NODE_ENV === "production";

// import/no-unresolved is intentionally NOT enforced (see decision below). We
// also drop the eslint-plugin-import dependency entirely. But the source still
// carries pre-existing inline `// eslint-disable-next-line import/...` comments
// (airbnb-era suppressions). Under flat config an inline directive that names an
// undefined rule is a hard error, and the no-source-edits constraint for this
// migration means we can't remove those comments. This minimal no-op stub simply
// registers the referenced rule names so the directives resolve; the rules never
// fire, matching the prior effective behavior (they were disabled on those lines
// anyway). Pulling in eslint-plugin-import-x just for this would also drag in
// @typescript-eslint/utils — unwanted weight in a no-TypeScript project.
// NOTE: this namespace is a decoy. Do not configure a real `import/*` rule
// against it — a stubbed name (e.g. import/prefer-default-export) would silently
// no-op. Install eslint-plugin-import-x first if real import linting is wanted.
const noopRule = { create: () => ({}) };
const importDirectiveStub = {
  rules: {
    "prefer-default-export": noopRule,
    "no-named-default": noopRule,
    "no-mutable-exports": noopRule,
  },
};

export default [
  // Honor .gitignore (node_modules, env files, editor dirs, etc.). Replaces the
  // old `--ignore-path .gitignore` CLI flag, which is not valid under flat config.
  includeIgnoreFile(gitignorePath),

  // dist/ is committed on tagged releases, so it's deliberately left un-ignored
  // in .gitignore (the commented-out `# /dist`). ESLint must still skip it, so
  // ignore it explicitly here. dist_electron/ is already excluded via .gitignore
  // (includeIgnoreFile above) but is listed too for defense-in-depth.
  {
    ignores: ["dist/**", "dist_electron/**"],
  },

  // Base JavaScript recommended rules.
  js.configs.recommended,

  // Vue 3 recommended (flat) — the flat-config equivalent of the old
  // "plugin:vue/vue3-recommended" extend.
  ...pluginVue.configs["flat/recommended"],

  // Disable the stylistic rules that conflict with Prettier. Prettier still runs
  // as its own separate `format` / `format:check` step (NOT as an eslint rule —
  // skip-formatting sets prettier/prettier to "off"). Placed before our explicit
  // overrides so the few rules we re-enable below (notably vue/max-len) win.
  skipFormatting,

  // Project rules + language environment. Applied after the recommended presets
  // and the Prettier disables, so these explicit overrides win over them — the
  // same precedence the old .eslintrc.js `rules:` block had over its `extends`.
  // (The two blocks below are file-scoped to Node/CommonJS config + e2e files
  // and intentionally set only languageOptions, no `rules`, so they don't affect
  // this rule precedence. Adding `rules` there would override these for the
  // files they match.)
  {
    // Match the eslintrc-era default: unused inline disable directives are not
    // reported (flat config defaults this to "warn"). Required so the vestigial
    // import/* suppression comments don't become warnings or get auto-stripped
    // by `--fix`. See importDirectiveStub above.
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    plugins: {
      import: importDirectiveStub,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Browser app: window/document/etc. The old `browser` env came from
      // airbnb; under flat config it must be supplied explicitly.
      globals: globals.browser,
    },
    rules: {
      "no-console": isProduction ? "error" : "off",
      "no-debugger": isProduction ? "error" : "off",
      "no-plusplus": "off",
      "vue/valid-v-slot": ["error", { allowModifiers: true }],
      "no-param-reassign": "off",
      // Component file names are intentionally not multi-word while 4.x and 5.x
      // are maintained in parallel.
      "vue/multi-word-component-names": "off",
      "vue/max-len": [
        "error",
        {
          code: 120,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreUrls: true,
        },
      ],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          // ESLint 9 changed the `caughtErrors` default from "none" to "all",
          // which newly flags pre-existing `catch (err)` bindings. Pin it back
          // to "none" to preserve the prior (ESLint 8) effective behavior and
          // avoid editing source for this tooling-only migration.
          caughtErrors: "none",
        },
      ],
      "prefer-destructuring": ["error", { object: true, array: false }],
      // The API is snake_case, so don't enforce camelcase on payloads.
      camelcase: "off",
    },
  },

  // Node-context files: build config and the Playwright e2e suite. These were
  // outside the old `eslint ... src` scope; the new `eslint .` scope includes
  // them, so grant Node globals (process, etc.) to avoid no-undef noise. There
  // are no unit tests / mocha env to port.
  {
    files: ["*.config.js", "e2e/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Legacy Vue CLI config is CommonJS (module.exports); lint it as such.
  {
    files: ["vue.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
];
