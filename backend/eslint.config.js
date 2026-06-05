// eslint.config.js — ESLint v9 flat config
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";

export default [
  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**", "**/*.js", "**/*.mjs"],
  },

  // TypeScript source files
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    rules: {
      // From eslint:recommended (key rules only — full set not needed in flat config)
      "no-undef": "off", // TypeScript handles this
      "no-unused-vars": "off", // Use @typescript-eslint version instead

      // TypeScript rules
      ...tseslint.configs["recommended"].rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",        // Most files use @ts-nocheck
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-require-imports": "warn",

      // Import ordering
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
      "sort-imports": "off",

      // Console usage
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
      },
    },
  },

  // Disable formatting rules that conflict with Prettier
  prettierConfig,
];
