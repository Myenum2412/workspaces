// eslint.config.js — ESLint v9 flat config
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";

export default [
  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**", "**/*.js", "**/*.mjs", "**/*.test.ts"],
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
    },
    rules: {
      // Core
      "no-undef": "off",       // TypeScript handles this
      "no-unused-vars": "off", // Use @typescript-eslint version instead

      // Spread recommended rules, then override
      ...tseslint.configs["recommended"].rules,

      // @ts-nocheck is used throughout the codebase — allow it
      "@typescript-eslint/ban-ts-comment": "off",

      // These produce too much noise given the @ts-nocheck pattern
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",

      // Useful warnings — keep as warn so CI doesn't fail
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-require-imports": "warn",

      // Console — warn only
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Disable formatting rules that conflict with Prettier
  prettierConfig,
];
