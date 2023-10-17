require("@rushstack/eslint-patch/modern-module-resolution");

const path = require("node:path");
const createAliasSetting = require("@vue/eslint-config-airbnb/createAliasSetting");

module.exports = {
  root: true,
  env: {
    es2021: true,
  },
  extends: ["plugin:vue/recommended", "@vue/eslint-config-airbnb", "prettier"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-plusplus": "off",
    "import/no-cycle": "off",
    "vue/valid-v-slot": [
      "error",
      {
        allowModifiers: true,
      },
    ],
    "no-param-reassign": "off",
    "import/no-unresolved": "error",
    // This is probably a good idea, but I don't want to diverge all the file names right now
    // while maintaining 4.x and 5.x.
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
      },
    ],
    "prefer-destructuring": ["error", { object: true, array: false }],
  },
  settings: {
    ...createAliasSetting({
      "@": `${path.resolve(__dirname, "./src")}`,
    }),
  },
  parserOptions: {},
  overrides: [
    {
      files: ["**/__tests__/*.{j,t}s?(x)"],
      env: {
        mocha: true,
      },
    },
  ],
};
